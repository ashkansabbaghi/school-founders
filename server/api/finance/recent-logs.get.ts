export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const termYear = typeof query.termYear === 'string' ? query.termYear : undefined
  const limit = typeof query.limit === 'string' ? Number.parseInt(query.limit, 10) : 10

  return listRecentLogs({
    termYear,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
  })
})
