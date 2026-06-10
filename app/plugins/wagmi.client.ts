import { WagmiPlugin } from '@wagmi/vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createConfig, http } from '@wagmi/vue'
import { baseSepolia } from '@wagmi/vue/chains'
import { injected } from '@wagmi/vue/connectors'

export default defineNuxtPlugin((nuxtApp) => {
  const config = createConfig({
    chains: [baseSepolia],
    connectors: [injected()],
    transports: {
      [baseSepolia.id]: http(),
    },
  })

  const queryClient = new QueryClient()

  nuxtApp.vueApp.use(WagmiPlugin, { config })
  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })
})
