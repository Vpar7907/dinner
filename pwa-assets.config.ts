import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

/** `npm run icons` renders the PWA icon set (favicon, apple-touch, maskable) from public/icon.svg. */
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#f45d1b' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#f45d1b' } },
  },
  images: ['public/icon.svg'],
});
