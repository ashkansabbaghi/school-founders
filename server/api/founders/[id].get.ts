export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'errors.validation.idRequired' })
  }

  const founder = await getFounder(id)

  if (!founder) {
    throw createError({ statusCode: 404, statusMessage: 'errors.notFound.founder' })
  }

  return founder
})
