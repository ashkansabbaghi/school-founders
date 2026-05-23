export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'errors.validation.idRequired',
    })
  }

  const existing = await getEmployeeTransaction(id)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'errors.notFound.employeeTransaction' })
  }

  const body = await readBody<Parameters<typeof saveEmployeeTransaction>[0]>(event)
  const transaction = await saveEmployeeTransaction({
    ...body,
    id,
  })

  return transaction
})
