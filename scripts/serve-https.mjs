#!/usr/bin/env node
/**
 * Hosts the built app over HTTPS on the local Wi-Fi network.
 *
 *   npm run host                 build + serve (https://<LAN-IP>:8443)
 *   npm run serve:https          serve the existing dist/
 *
 * Options:
 *   --port <n>       HTTPS port (default 8443, env HTTPS_PORT)
 *   --http-port <n>  helper HTTP port with the certificate and instructions (default 8080, env HTTP_PORT)
 *   --build          rebuild dist/ before serving
 *   --trust          add the local CA to this computer's trusted roots (Windows/macOS)
 *   --no-qr          do not print QR codes
 *
 * Why a local CA instead of a plain self-signed certificate: browsers refuse
 * to register a service worker on a page with a certificate error, so offline
 * mode would never work. The script creates a long-lived local certificate
 * authority once (.cert/ca.crt), and on every start issues a fresh server
 * certificate for the current LAN addresses. Install ca.crt on a phone once —
 * after that the app opens without warnings and keeps working offline.
 */
import { spawnSync, execFileSync } from 'node:child_process';
import { generateKeyPairSync, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import forge from 'node-forge';
import qrcode from 'qrcode-terminal';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const CERT_DIR = path.join(ROOT, '.cert');

// ─── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const HTTPS_PORT = Number(option('port', process.env.HTTPS_PORT ?? 8443));
const HTTP_PORT = Number(option('http-port', process.env.HTTP_PORT ?? 8080));
const color = {
  bold: (s) => `\x1b[1m${s}\x1b[22m`,
  dim: (s) => `\x1b[2m${s}\x1b[22m`,
  green: (s) => `\x1b[32m${s}\x1b[39m`,
  orange: (s) => `\x1b[38;5;208m${s}\x1b[39m`,
  red: (s) => `\x1b[31m${s}\x1b[39m`,
  cyan: (s) => `\x1b[36m${s}\x1b[39m`,
};

// ─── Build ────────────────────────────────────────────────────────────────────

if (flag('build') || !existsSync(path.join(DIST, 'index.html'))) {
  console.log(color.orange('▸ Сборка приложения…'));
  const result = spawnSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error(color.red('✖ Сборка не удалась'));
    process.exit(result.status ?? 1);
  }
}

// ─── Network ──────────────────────────────────────────────────────────────────

const VIRTUAL_INTERFACE = /tun|tap|vpn|wg\d|vethernet|docker|br-|wsl|virtual|vmware|vbox|hyper-v|zerotier|tailscale|loopback/i;
const WIFI_INTERFACE = /wi-?fi|wlan|wireless|беспровод|^en0$/i;

/** Wi-Fi and home-LAN addresses first: they are the ones a phone can reach. VPN/VM adapters go last. */
function addressScore({ name, address }) {
  let score = 0;
  if (WIFI_INTERFACE.test(name)) score += 4;
  if (address.startsWith('192.168.')) score += 2;
  else if (address.startsWith('10.')) score += 1;
  if (VIRTUAL_INTERFACE.test(name)) score -= 10;
  return score;
}

function lanAddresses() {
  const result = [];
  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      const v4 = entry.family === 'IPv4' || entry.family === 4;
      if (v4 && !entry.internal && !entry.address.startsWith('169.254.')) result.push({ name, address: entry.address });
    }
  }
  return result.sort((a, b) => addressScore(b) - addressScore(a));
}

const hostname = os.hostname().toLowerCase();
const addresses = lanAddresses();

// ─── Certificates ─────────────────────────────────────────────────────────────

function newKeyPair() {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { privateKey: forge.pki.privateKeyFromPem(privateKey), publicKey: forge.pki.publicKeyFromPem(publicKey) };
}

/** Positive random serial number (the leading 01 keeps the high bit clear). */
const serial = () => `01${randomBytes(15).toString('hex')}`;

function createCa() {
  const keys = newKeyPair();
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = serial();
  cert.validity.notBefore = new Date(Date.now() - 60_000);
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);
  const subject = [
    { name: 'commonName', value: `Menu Nedeli Local CA (${hostname})` },
    { name: 'organizationName', value: 'Menu Nedeli (local development)' },
  ];
  cert.setSubject(subject);
  cert.setIssuer(subject);
  cert.setExtensions([
    { name: 'basicConstraints', cA: true, pathLenConstraint: 0, critical: true },
    { name: 'keyUsage', keyCertSign: true, cRLSign: true, critical: true },
    { name: 'subjectKeyIdentifier' },
  ]);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  return { cert, key: keys.privateKey };
}

function createServerCert(ca, altNames) {
  const keys = newKeyPair();
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = serial();
  cert.validity.notBefore = new Date(Date.now() - 60_000);
  // 397 days: within the limit Apple and Chrome accept for TLS server certificates.
  cert.validity.notAfter = new Date(Date.now() + 397 * 24 * 3600 * 1000);
  cert.setSubject([{ name: 'commonName', value: altNames.dns[0] }]);
  cert.setIssuer(ca.cert.subject.attributes);
  cert.setExtensions([
    { name: 'basicConstraints', cA: false, critical: true },
    { name: 'keyUsage', digitalSignature: true, keyEncipherment: true, critical: true },
    { name: 'extKeyUsage', serverAuth: true },
    {
      name: 'subjectAltName',
      altNames: [...altNames.dns.map((value) => ({ type: 2, value })), ...altNames.ip.map((ip) => ({ type: 7, ip }))],
    },
    { name: 'subjectKeyIdentifier' },
    { name: 'authorityKeyIdentifier', keyIdentifier: ca.cert.generateSubjectKeyIdentifier().getBytes() },
  ]);
  cert.sign(ca.key, forge.md.sha256.create());
  return { cert, key: keys.privateKey };
}

function loadCertificates() {
  mkdirSync(CERT_DIR, { recursive: true });
  const caCertPath = path.join(CERT_DIR, 'ca.crt');
  const caKeyPath = path.join(CERT_DIR, 'ca.key');
  const serverCertPath = path.join(CERT_DIR, 'server.crt');
  const serverKeyPath = path.join(CERT_DIR, 'server.key');
  const serverInfoPath = path.join(CERT_DIR, 'server.json');

  let ca;
  let caCreated = false;
  if (existsSync(caCertPath) && existsSync(caKeyPath)) {
    ca = { cert: forge.pki.certificateFromPem(readFileSync(caCertPath, 'utf8')), key: forge.pki.privateKeyFromPem(readFileSync(caKeyPath, 'utf8')) };
  } else {
    console.log(color.orange('▸ Создаю локальный центр сертификации (один раз)…'));
    ca = createCa();
    writeFileSync(caCertPath, forge.pki.certificateToPem(ca.cert));
    writeFileSync(caKeyPath, forge.pki.privateKeyToPem(ca.key), { mode: 0o600 });
    caCreated = true;
  }

  const altNames = {
    dns: ['localhost', hostname, `${hostname}.local`],
    // Sorted so the certificate is not reissued just because interfaces were listed in another order.
    ip: ['127.0.0.1', ...addresses.map((a) => a.address).sort()],
  };
  const wanted = JSON.stringify(altNames);
  const info = existsSync(serverInfoPath) ? JSON.parse(readFileSync(serverInfoPath, 'utf8')) : null;
  const stillValid = info && info.altNames === wanted && info.ca === ca.cert.serialNumber && info.notAfter - Date.now() > 30 * 24 * 3600 * 1000;

  if (!stillValid || !existsSync(serverCertPath) || !existsSync(serverKeyPath)) {
    console.log(color.orange('▸ Выпускаю сертификат для текущих адресов сети…'));
    const server = createServerCert(ca, altNames);
    writeFileSync(serverCertPath, forge.pki.certificateToPem(server.cert));
    writeFileSync(serverKeyPath, forge.pki.privateKeyToPem(server.key), { mode: 0o600 });
    writeFileSync(
      serverInfoPath,
      JSON.stringify({ altNames: wanted, ca: ca.cert.serialNumber, notAfter: server.cert.validity.notAfter.getTime() }, null, 2),
    );
  }

  return {
    caCreated,
    caPem: readFileSync(caCertPath),
    caDer: Buffer.from(forge.asn1.toDer(forge.pki.certificateToAsn1(ca.cert)).getBytes(), 'binary'),
    cert: readFileSync(serverCertPath),
    key: readFileSync(serverKeyPath),
  };
}

const certs = loadCertificates();

if (flag('trust')) trustCaLocally(path.join(CERT_DIR, 'ca.crt'));

function trustCaLocally(caPath) {
  try {
    if (process.platform === 'win32') {
      // Current-user store: Windows shows a confirmation dialog, no admin rights needed.
      execFileSync('certutil', ['-user', '-addstore', 'Root', caPath], { stdio: 'inherit' });
    } else if (process.platform === 'darwin') {
      execFileSync('security', ['add-trusted-cert', '-r', 'trustRoot', '-k', path.join(os.homedir(), 'Library/Keychains/login.keychain-db'), caPath], {
        stdio: 'inherit',
      });
    } else {
      console.log(color.dim(`Linux: sudo cp ${caPath} /usr/local/share/ca-certificates/menu-nedeli.crt && sudo update-ca-certificates`));
      return;
    }
    console.log(color.green('✔ Сертификат добавлен в доверенные на этом компьютере (перезапустите браузер).'));
  } catch {
    console.log(color.red('✖ Не удалось добавить сертификат автоматически — установите .cert/ca.crt вручную.'));
  }
}

// ─── Static file server ───────────────────────────────────────────────────────

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.svg', '.txt']);
const gzipCache = new Map();

function cacheControl(relative) {
  // The service worker, its manifest and the HTML shell must always be revalidated so updates arrive.
  if (relative === 'sw.js' || relative.startsWith('workbox-') || relative.endsWith('.html') || relative.endsWith('.webmanifest')) {
    return 'no-cache';
  }
  if (relative.startsWith('assets/')) return 'public, max-age=31536000, immutable';
  return 'public, max-age=3600';
}

function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }
  const relative = path.posix.normalize(decoded).replace(/^(\.\.(\/|$))+/, '').replace(/^\/+/, '') || 'index.html';
  const absolute = path.join(DIST, relative);
  if (!absolute.startsWith(DIST)) return null; // path traversal
  if (existsSync(absolute) && statSync(absolute).isFile()) return { absolute, relative };
  // SPA fallback: unknown routes without an extension get the app shell.
  if (!path.extname(relative)) return { absolute: path.join(DIST, 'index.html'), relative: 'index.html' };
  return null;
}

function sendCa(res, format) {
  res.writeHead(200, {
    'Content-Type': format === 'pem' ? 'application/x-pem-file' : 'application/x-x509-ca-cert',
    'Content-Disposition': `attachment; filename="menu-nedeli-ca.${format === 'pem' ? 'pem' : 'crt'}"`,
    'Cache-Control': 'no-cache',
  });
  res.end(format === 'pem' ? certs.caPem : certs.caDer);
}

function serveStatic(req, res) {
  const url = req.url ?? '/';
  if (url === '/ca.crt') return sendCa(res, 'der');
  if (url === '/ca.pem') return sendCa(res, 'pem');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  const file = resolveFile(url);
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Не найдено');
    return;
  }

  const ext = path.extname(file.absolute);
  const headers = {
    'Content-Type': MIME[ext] ?? 'application/octet-stream',
    'Cache-Control': cacheControl(file.relative),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  };
  if (file.relative === 'sw.js') headers['Service-Worker-Allowed'] = '/';

  let body = readFileSync(file.absolute);
  if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')) {
    const mtime = statSync(file.absolute).mtimeMs;
    const cached = gzipCache.get(file.absolute);
    if (cached?.mtime === mtime) body = cached.body;
    else {
      const gz = zlib.gzipSync(body, { level: 9 });
      gzipCache.set(file.absolute, { mtime, body: gz });
      body = gz;
    }
    headers['Content-Encoding'] = 'gzip';
    headers.Vary = 'Accept-Encoding';
  }
  headers['Content-Length'] = body.length;
  res.writeHead(200, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
  log(req, 200);
}

function log(req, status) {
  const time = new Date().toLocaleTimeString('ru-RU');
  console.log(color.dim(`${time} ${req.socket.remoteAddress?.replace('::ffff:', '') ?? ''} ${status} ${req.method} ${req.url}`));
}

// ─── Helper page over plain HTTP (certificate download + instructions) ────────

function landingPage(httpsUrl) {
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Меню недели — подключение</title>
<style>
  :root { color-scheme: light; --brand: #f45d1b; }
  body { margin: 0; font: 16px/1.5 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #fdfbf7; color: #1f1d1a; }
  main { max-width: 640px; margin: 0 auto; padding: 24px 16px 48px; }
  h1 { font-size: 26px; margin: 8px 0 4px; } h2 { font-size: 18px; margin: 28px 0 8px; }
  .card { background: #fff; border-radius: 20px; padding: 16px 18px; box-shadow: 0 8px 24px -12px rgba(0,0,0,.18); margin-top: 12px; }
  .btn { display: inline-block; background: var(--brand); color: #fff; text-decoration: none; font-weight: 700; padding: 12px 18px; border-radius: 14px; margin: 6px 6px 0 0; }
  .btn.alt { background: #1f1d1a; }
  ol { padding-left: 20px; margin: 6px 0; } li { margin: 4px 0; } code { background: #f8f4ec; padding: 2px 6px; border-radius: 6px; }
  .muted { color: #7a746a; font-size: 14px; }
</style></head><body><main>
  <div style="font-size:44px">🍲</div>
  <h1>Меню недели в вашей сети</h1>
  <p class="muted">Чтобы приложение открывалось по HTTPS без предупреждений и работало офлайн, один раз установите сертификат на устройство.</p>
  <div class="card">
    <a class="btn" href="/ca.crt">1. Скачать сертификат</a>
    <a class="btn alt" href="${httpsUrl}">2. Открыть приложение</a>
  </div>

  <h2>📱 iPhone / iPad</h2>
  <div class="card"><ol>
    <li>Откройте эту страницу в <b>Safari</b> и нажмите «Скачать сертификат» → «Разрешить».</li>
    <li>Настройки → Основные → <b>VPN и управление устройством</b> → профиль «Menu Nedeli Local CA» → Установить.</li>
    <li>Настройки → Основные → Об этом устройстве → <b>Доверие сертификатам</b> → включите переключатель для «Menu Nedeli Local CA».</li>
    <li>Откройте приложение, нажмите «Поделиться» → «На экран „Домой“».</li>
  </ol></div>

  <h2>🤖 Android</h2>
  <div class="card"><ol>
    <li>Нажмите «Скачать сертификат».</li>
    <li>Настройки → Безопасность (или «Защита и конфиденциальность») → Шифрование и учётные данные → <b>Установить сертификат</b> → <b>Сертификат ЦС</b> → выберите скачанный файл.</li>
    <li>Откройте приложение в Chrome → меню ⋮ → «Установить приложение».</li>
  </ol></div>

  <h2>💻 Компьютер</h2>
  <div class="card"><ol>
    <li>На компьютере с сервером: <code>npm run serve:https -- --trust</code>.</li>
    <li>На другом Windows-ПК: откройте скачанный файл → «Установить сертификат» → «Текущий пользователь» → хранилище «Доверенные корневые центры сертификации».</li>
    <li>macOS: откройте файл в «Связке ключей» → двойной клик → Доверие → «Всегда доверять».</li>
  </ol></div>

  <p class="muted" style="margin-top:28px">Сертификат создан только для этого компьютера и вашей локальной сети. Его закрытый ключ хранится в <code>.cert/</code> и никуда не передаётся. Данные приложения хранятся на каждом устройстве отдельно.</p>
</main></body></html>`;
}

// ─── Start ────────────────────────────────────────────────────────────────────

const primary = addresses[0]?.address ?? 'localhost';
const httpsUrl = (host) => `https://${host}:${HTTPS_PORT}/`;
const httpUrl = (host) => `http://${host}:${HTTP_PORT}/`;

const httpsServer = https.createServer({ key: certs.key, cert: certs.cert }, serveStatic);

const httpServer = http.createServer((req, res) => {
  if (req.url === '/ca.crt') return sendCa(res, 'der');
  if (req.url === '/ca.pem') return sendCa(res, 'pem');
  const host = (req.headers.host ?? primary).split(':')[0];
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    res.end(landingPage(httpsUrl(host)));
    return;
  }
  res.writeHead(302, { Location: `${httpsUrl(host).slice(0, -1)}${req.url}` }).end();
});

function onListenError(port) {
  return (error) => {
    if (error.code === 'EADDRINUSE') console.error(color.red(`✖ Порт ${port} уже занят. Укажите другой: --port / --http-port`));
    else console.error(color.red(`✖ ${error.message}`));
    process.exit(1);
  };
}

httpsServer.on('error', onListenError(HTTPS_PORT));
httpServer.on('error', onListenError(HTTP_PORT));

httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
  httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log('');
    console.log(color.bold(color.orange('🍲 Меню недели доступно по Wi-Fi')));
    console.log('');
    console.log(`   ${color.bold('Приложение (HTTPS):')}`);
    console.log(`     ${color.cyan(httpsUrl('localhost'))}`);
    for (const { name, address } of addresses) console.log(`     ${color.cyan(httpsUrl(address))} ${color.dim(`(${name})`)}`);
    console.log(`     ${color.cyan(httpsUrl(`${hostname}.local`))} ${color.dim('(mDNS, если поддерживается)')}`);
    console.log('');
    console.log(`   ${color.bold('Первое подключение телефона')} — сертификат и инструкция:`);
    console.log(`     ${color.cyan(httpUrl(primary))}`);
    if (certs.caCreated) console.log(color.orange('   ⚠ Сертификат создан впервые: установите его на устройства по ссылке выше.'));
    if (addresses.length === 0) console.log(color.red('   ⚠ Сетевые адреса не найдены — подключитесь к Wi-Fi и перезапустите.'));
    if (process.platform === 'win32') {
      console.log(color.dim('   Если Windows спросит о брандмауэре — разрешите доступ в частных сетях.'));
    }

    if (!flag('no-qr') && addresses.length > 0) {
      console.log('');
      console.log(color.dim('   Отсканируйте камерой телефона (страница установки сертификата):'));
      qrcode.generate(httpUrl(primary), { small: true }, (code) => console.log(code.replace(/^/gm, '   ')));
    }
    console.log(color.dim('   Остановить: Ctrl+C'));
    console.log('');
  });
});

const shutdown = () => {
  console.log(color.dim('\nОстанавливаю сервер…'));
  httpsServer.close();
  httpServer.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
