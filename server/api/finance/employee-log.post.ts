export default defineEventHandler(async (event) => {
  const body = await readBody<Parameters<typeof saveEmployeeTransaction>[0]>(event)
  const transaction = await saveEmployeeTransaction(body)

  setResponseStatus(event, 201)
  return transaction
})
