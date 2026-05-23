export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const schoolId = typeof query.schoolId === 'string' ? query.schoolId : undefined
  const employeeId = typeof query.employeeId === 'string' ? query.employeeId : undefined
  const termYear = typeof query.termYear === 'string' ? query.termYear : undefined

  return listEmployeeTransactions({ schoolId, employeeId, termYear })
})
