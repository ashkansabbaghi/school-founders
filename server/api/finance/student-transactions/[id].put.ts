export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'errors.validation.idRequired',
    })
  }

  const existing = await getStudentTransaction(id)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'errors.notFound.studentTransaction' })
  }

  const body = await readBody<Parameters<typeof saveStudentTransaction>[0]>(event)
  const transaction = await saveStudentTransaction({
    ...body,
    id,
  })

  return transaction
})
