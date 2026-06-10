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
    esbuild: {
      options: {
        target: 'es2020',
      },
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
      script: [
        {
          key: 'theme-init',
          innerHTML: `(function(){try{var k='yieldagent-theme';var p=localStorage.getItem(k)||'system';var r=p==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;document.documentElement.dataset.theme=r;document.documentElement.style.colorScheme=r;}catch(e){var f=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=f;document.documentElement.style.colorScheme=f;}})();`,
          tagPosition: 'head',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
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
