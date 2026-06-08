import { getState } from '../../utils/app-store'

export default defineEventHandler(() => {
  return getState().strategies
})
