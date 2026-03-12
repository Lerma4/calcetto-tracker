import pkg from './package.json'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/icon', '@nuxtjs/color-mode'],
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
})
