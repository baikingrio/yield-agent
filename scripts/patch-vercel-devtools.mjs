import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const outputDir = join(process.cwd(), '.vercel', 'output')
const funcDir = join(outputDir, 'functions', '__fallback.func')
const stubDir = join(funcDir, 'node_modules', 'vue-devtools-stub')

if (!existsSync(stubDir)) {
  process.exit(0)
}

mkdirSync(join(funcDir, 'node_modules', '@vue'), { recursive: true })
for (const name of ['devtools-api', 'devtools-kit']) {
  cpSync(stubDir, join(funcDir, 'node_modules', '@vue', name), { recursive: true })
}
