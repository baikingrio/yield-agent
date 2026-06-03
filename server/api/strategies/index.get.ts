import { getState } from '../../utils/demo-store'

export default defineEventHandler(() => {
  return getState().strategies
})
