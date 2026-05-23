export default defineEventHandler(async (event) => {
  const body = await readBody<Parameters<typeof saveEmployee>[0]>(event)
  const employee = await saveEmployee(body)

  setResponseStatus(event, 201)
  return employee
})
