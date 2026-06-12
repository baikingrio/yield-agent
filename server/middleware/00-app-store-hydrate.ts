import { ensureAppStoreHydrated } from '../utils/app-store'

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/')) return
  await ensureAppStoreHydrated()
})
