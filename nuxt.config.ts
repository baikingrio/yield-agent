// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

const sharedDir = fileURLToPath(new URL('./shared', import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  alias: {
    '#shared': sharedDir,
  },
  nitro: {
    alias: {
      '#shared': sharedDir,
      // Avoid ERR_REQUIRE_ESM (perfect-debounce) from @vue/devtools-kit on serverless SSR.
      ...(process.env.NODE_ENV === 'production'
        ? {
            '@vue/devtools-kit': 'vue-devtools-stub',
            '@vue/devtools-api': 'vue-devtools-stub',
          }
        : {}),
    },
  },
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  runtimeConfig: {
    public: {
      walletConnectProjectId: '',
    },
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
        },
      ],
    },
  },
})
