export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'errors.validation.idRequired' })
  }

  const existing = await getFounder(id)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'errors.notFound.founder' })
  }

  await removeFounder(id)
  setResponseStatus(event, 204)
})
