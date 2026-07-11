import { fileURLToPath } from 'node:url'

const baseURL = process.env.NUXT_APP_BASE_URL || '/'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  ssr: false,

  nitro: {
    preset: 'static',
    storage: {
      db: {
        driver: 'fs',
        base: fileURLToPath(new URL('./data', import.meta.url)),
      },
    },
  },

  app: {
    baseURL,
    head: {
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
      meta: [
        { name: 'theme-color', content: '#18181b' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'School Fanders' },
      ],
    },
    pageTransition: {
      name: 'page',
      mode: 'out-in',
    },
  },

  css: [fileURLToPath(new URL('./assets/css/main.css', import.meta.url))],

  tailwindcss: {
    cssPath: false,
  },

  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@nuxtjs/i18n', '@vite-pwa/nuxt'],

  i18n: {
    defaultLocale: 'fa',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
    },
    locales: [
      { code: 'fa', language: 'fa-IR', name: 'فارسی', dir: 'rtl', file: 'fa.json' },
      { code: 'en', language: 'en-US', name: 'English', dir: 'ltr', file: 'en.json' },
    ],
  },

  pwa: {
    registerType: 'autoUpdate',
    includeAssets: [
      'favicon.ico',
      'apple-touch-icon.png',
      'pwa-192x192.png',
      'pwa-512x512.png',
      'maskable-icon-512x512.png',
      'robots.txt',
    ],
    manifest: {
      name: 'School Fanders',
      short_name: 'Fanders',
      description: 'مدیریت مالی مدرسه — آفلاین و محلی روی دستگاه شما',
      theme_color: '#18181b',
      background_color: '#09090b',
      display: 'standalone',
      orientation: 'portrait',
      dir: 'rtl',
      lang: 'fa',
      start_url: baseURL,
      scope: baseURL,
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: 'maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,json,woff2,svg,png,ico,webp,webmanifest}'],
      navigateFallback: baseURL,
      navigateFallbackDenylist: [/^\/api\//],
      cleanupOutdatedCaches: true,
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },
})
