export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'errors.validation.idRequired',
    })
  }

  await removeStudentTransaction(id)
  setResponseStatus(event, 204)
})
