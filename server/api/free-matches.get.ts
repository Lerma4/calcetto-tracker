import { getFreeMatchDetailRows } from '../utils/free-matches'

export default defineEventHandler(async () => {
  return getFreeMatchDetailRows()
})
