import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Derleme zamanı damgası — PDF içe aktarma hata ekranında sürümü gösterir
  define: {
    __PERIM_SURUM__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Bildirime dokununca uygulamayı açan dinleyici (public/sw-bildirim.js)
      workbox: { importScripts: ['sw-bildirim.js'] },
      includeAssets: [
        'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'og.png',
        // Self-host edilmiş fontlar da ön-belleğe girmeli; yoksa çevrimdışı
        // açılışta sistem fontuna düşer.
        'fonts/*.woff2',
      ],
      manifest: {
        name: 'Perim',
        short_name: 'Perim',
        description: 'Perimenopoz & BHRT takip uygulaması',
        lang: 'tr',
        theme_color: '#EDE7DA',
        background_color: '#F5F0E6',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          // Maskable ayrı dosya: kenar payı bırakılmış sürüm. Aynı dosyaya
          // "any maskable" demek, Android'in ikonu kırpmasına yol açıyordu.
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
