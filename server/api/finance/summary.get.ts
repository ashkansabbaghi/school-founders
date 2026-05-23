export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const termYear = typeof query.termYear === 'string' ? query.termYear : undefined

  return calculateFinanceSummary({ termYear })
})
