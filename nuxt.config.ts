export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/icon', '@nuxtjs/color-mode'],
  css: ['~/assets/css/main.css'],
  colorMode: {
    preference: 'cupcake', // default value of $colorMode.preference
    dataValue: 'theme', // Use data-theme attribute
    classSuffix: '',
  }
})
