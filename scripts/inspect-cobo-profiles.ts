import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Configuration, WalletsApi, BalanceApi } from '@cobo/agentic-wallet'

const base = '/root/.cobo-agentic-wallet/profiles'
const redact = (obj: any) => JSON.stringify(obj, (k, v) => /key|token|secret|password/i.test(String(k)) ? '[REDACTED]' : v, 2)

for (const dir of readdirSync(base).filter((d) => d.startsWith('profile_'))) {
  const credPath = join(base, dir, 'credentials')
  try {
    const creds = JSON.parse(readFileSync(credPath, 'utf8'))
    if (!String(creds.api_url ?? '').includes('dev.cobo.com')) continue
    const config = new Configuration({ basePath: creds.api_url, apiKey: creds.api_key })
    const walletsApi = new WalletsApi(config)
    const balanceApi = new BalanceApi(config)
    console.log('\nPROFILE', dir, creds.agent_id, creds.wallet_uuid)
    try {
      const a = await walletsApi.listWalletAddresses(creds.wallet_uuid)
      console.log('addresses', redact(a.data.result))
    } catch (err: any) {
      console.log('addresses_error', err?.response?.status, redact(err?.response?.data ?? err.message))
    }
    try {
      const b = await balanceApi.listBalances(creds.wallet_uuid, undefined, undefined, undefined, false, 20)
      console.log('balances', redact(b.data.result))
    } catch (err: any) {
      console.log('balances_error', err?.response?.status, redact(err?.response?.data ?? err.message))
    }
  } catch {}
}
