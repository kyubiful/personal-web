/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'selector',
  theme: {
    extend: {
      boxShadow: {
        borderBlack: '3px 3px 1px 0px rgba(31,41,55,1)',
        borderWhite: '3px 3px 1px 0px rgba(243,244,246,1)'
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
