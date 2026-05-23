export default defineEventHandler(async (event) => {
  const body = await readBody<Parameters<typeof saveStudent>[0]>(event)
  const student = await saveStudent(body)

  setResponseStatus(event, 201)
  return student
})
