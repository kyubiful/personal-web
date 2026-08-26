import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import vercel from '@astrojs/vercel'

// https://astro.build/config
export default defineConfig({
  output: 'static',
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      prefixDefaultLocale: false
    }
  },
  markdown: {
    shikiConfig: {
      theme: 'one-dark-pro'
    }
  },
  vite: {
    plugins: [tailwindcss()]
  },
  adapter: vercel({
    webAnalytics: {
      enabled: true
    },
    imageService: false
  })
})
