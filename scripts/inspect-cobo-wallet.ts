import { readFileSync } from 'node:fs'
import { Configuration, BalanceApi, WalletsApi } from '@cobo/agentic-wallet'

const creds = JSON.parse(readFileSync('/root/.cobo-agentic-wallet/profiles/profile_caw_agent_04e0e1e53e6f480d/credentials', 'utf8'))
const config = new Configuration({ basePath: creds.api_url, apiKey: creds.api_key })
const balanceApi = new BalanceApi(config)
const walletsApi = new WalletsApi(config)

const redact = (obj: any) => JSON.stringify(obj, (k, v) => {
  if (typeof k === 'string' && /key|token|secret|password/i.test(k)) return '[REDACTED]'
  return v
}, 2)

async function main() {
  for (const [label, fn] of [
    ['wallet', () => walletsApi.getWallet(creds.wallet_uuid)],
    ['addresses', () => walletsApi.listWalletAddresses(creds.wallet_uuid)],
    ['balances', () => balanceApi.listBalances(creds.wallet_uuid, 'TBASE_SETH', undefined, undefined, true, 100)],
  ] as const) {
    try {
      const resp = await fn()
      console.log(label, redact(resp.data.result))
    } catch (err: any) {
      console.log(`${label}_error`, err?.response?.status, redact(err?.response?.data ?? err.message))
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
