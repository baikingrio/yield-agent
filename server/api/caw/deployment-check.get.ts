import { getState } from '../../utils/app-store'
import { buildCawDeploymentCheck } from '../../utils/caw-deployment-check'
import { probeCawDeployment } from '../../utils/caw-deployment-probe'

export default defineEventHandler(async (event) => {
  const state = getState()
  if (getQuery(event).sync !== 'true') {
    return buildCawDeploymentCheck(state)
  }
  const probe = await probeCawDeployment(state)
  return buildCawDeploymentCheck(state, probe)
})
