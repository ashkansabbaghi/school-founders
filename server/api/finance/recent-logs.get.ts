export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const termYear = typeof query.termYear === 'string' ? query.termYear : undefined
  const parsedLimit = typeof query.limit === 'string'
    ? Number.parseInt(query.limit, 10)
    : undefined
  const limit = parsedLimit !== undefined && Number.isFinite(parsedLimit) && parsedLimit > 0
    ? parsedLimit
    : undefined

  return listRecentLogs({
    termYear,
    ...(limit !== undefined ? { limit } : {}),
  })
})
