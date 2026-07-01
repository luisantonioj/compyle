import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  define: {
    global: 'window',
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      // Registration is handled in src/pwaUpdates.ts so updateViaCache can be
      // disabled and update checks can also run when the app returns to focus.
      injectRegister: false,
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
      },
      manifest: {
        name: 'compyle',
        short_name: 'compyle',
        description: 'Her all-in-one personal companion',
        theme_color: '#f4efe4',
        background_color: '#f4efe4',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  server: { port: 5173 },
});
