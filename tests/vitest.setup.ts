import { beforeEach } from 'vitest'
import { resetDatabaseConnection } from '../server/db/client'
import { resetRepositoryRuntimeState } from '../server/db/runtime-state'

beforeEach(() => {
  delete process.env.DATABASE_URL
  process.env.DATABASE_PATH = ':memory:'
  resetRepositoryRuntimeState()
  resetDatabaseConnection()
})
