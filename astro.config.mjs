import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import vercel from '@astrojs/vercel/static'

// https://astro.build/config
export default defineConfig({
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
  integrations: [tailwind()],
  adapter: vercel({
    webAnalytics: {
      enabled: true
    },
    imageService: false
  })
})
