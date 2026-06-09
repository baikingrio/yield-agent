// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

const sharedDir = fileURLToPath(new URL('./shared', import.meta.url))

/** Stub devtools on server bundles — real kit does require(ESM) on Node 20 (Vercel default). */
const devtoolsStubAliases = {
  '@vue/devtools-kit': 'vue-devtools-stub',
  '@vue/devtools-api': 'vue-devtools-stub',
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  alias: {
    '#shared': sharedDir,
    ...devtoolsStubAliases,
  },
  nitro: {
    alias: {
      '#shared': sharedDir,
      ...devtoolsStubAliases,
    },
    externals: {
      inline: ['@vue/devtools-kit', '@vue/devtools-api', 'vue-devtools-stub'],
    },
  },
  vite: {
    resolve: {
      alias: devtoolsStubAliases,
    },
  },
  devtools: { enabled: false },
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
