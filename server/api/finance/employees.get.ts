export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const schoolId = typeof query.schoolId === 'string' ? query.schoolId : undefined

  return listEmployees(schoolId)
})
