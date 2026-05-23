export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const schoolId = typeof query.schoolId === 'string' ? query.schoolId : undefined
  const studentId = typeof query.studentId === 'string' ? query.studentId : undefined
  const termYear = typeof query.termYear === 'string' ? query.termYear : undefined

  return listStudentTransactions({ schoolId, studentId, termYear })
})
