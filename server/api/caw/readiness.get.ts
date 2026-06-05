import { getState } from '../../utils/demo-store'
import { buildCawReadiness } from '../../utils/caw-readiness'

export default defineEventHandler(() => buildCawReadiness(getState()))
