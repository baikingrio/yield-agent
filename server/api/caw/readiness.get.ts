import { getState } from '../../utils/app-store'
import { buildCawReadiness } from '../../utils/caw-readiness'

export default defineEventHandler(() => buildCawReadiness(getState()))
