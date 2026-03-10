import type { Config } from 'tailwindcss'

export default <Config>{
  content: [
    './{components,layouts,pages}/**/*.{vue,js,ts,jsx,tsx}',
    './app.vue',
    './server/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
  ],
  plugins: [require('daisyui')],
  daisyui: {
    themes: ["cupcake", "dracula", "emerald"],
  },
}
