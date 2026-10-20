export type TextPart = { type: 'text'; value: string } | { type: 'link'; value: string; href: string };

// http(s)://… or www.…; trailing punctuation is not part of the link.
// Commas end a link too: "https://a.ru,https://b.ru" are two links (commas are rare in recipe URLs).
const URL_PATTERN = /\b((?:https?:\/\/|www\.)[^\s<>"',]*[^\s<>"'.,;:!?)\]»])/gi;

/** Splits text into plain parts and links so links can be rendered as anchors. */
export function linkify(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ type: 'text', value: text.slice(last, index) });
    const value = match[0];
    parts.push({ type: 'link', value, href: value.startsWith('www.') ? `https://${value}` : value });
    last = index + value.length;
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts;
}

export function firstLink(text: string): string | null {
  const link = linkify(text).find((p) => p.type === 'link');
  return link && link.type === 'link' ? link.href : null;
}

/** Short label for a link: the host without "www.". */
export function linkLabel(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return href;
  }
}
