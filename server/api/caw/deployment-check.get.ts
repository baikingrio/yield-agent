import { getState } from '../../utils/app-store'
import { buildCawDeploymentCheck } from '../../utils/caw-deployment-check'
import { probeCawDeployment } from '../../utils/caw-deployment-probe'
import { probePostgresConnection } from '../../utils/postgres-probe'

export default defineEventHandler(async (event) => {
  const state = getState()
  const postgresReachable = await probePostgresConnection()
  if (getQuery(event).sync !== 'true') {
    return buildCawDeploymentCheck(state, { tssOnline: null, boundTssNodeId: null, walletStatus: null, postgresReachable })
  }
  const probe = await probeCawDeployment(state)
  return buildCawDeploymentCheck(state, { ...probe, postgresReachable })
})
