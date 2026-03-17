import pkg from './package.json'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/icon', '@nuxtjs/color-mode'],
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    head: {
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@300;400;600;700;800&display=swap',
        },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  colorMode: {
    preference: 'dracula', // default value of $colorMode.preference
    dataValue: 'theme', // Use data-theme attribute
    classSuffix: '',
  },
  runtimeConfig: {
    public: {
      appVersion: pkg.version,
    },
  },
  nitro: {
    experimental: {
      websocket: true
    }
  }
})
