import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
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

  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@nuxtjs/i18n'],

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

  nitro: {
    storage: {
      db: {
        driver: 'fs',
        base: fileURLToPath(new URL('./data', import.meta.url)),
      },
    },
  },
})