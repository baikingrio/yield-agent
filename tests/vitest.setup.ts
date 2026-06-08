import { beforeEach } from 'vitest'
import { resetDatabaseConnection } from '../server/db/client'

beforeEach(() => {
  process.env.DATABASE_PATH = ':memory:'
  resetDatabaseConnection()
})
