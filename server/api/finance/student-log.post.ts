export default defineEventHandler(async (event) => {
  const body = await readBody<Parameters<typeof saveStudentTransaction>[0]>(event)
  const transaction = await saveStudentTransaction(body)

  setResponseStatus(event, 201)
  return transaction
})
