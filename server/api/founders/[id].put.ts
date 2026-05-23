export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'errors.validation.idRequired' })
  }

  const existing = await getFounder(id)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'errors.notFound.founder' })
  }

  const body = await readBody<{ name?: string, school?: string }>(event)

  if (!body.name?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'errors.validation.required',
      data: { field: 'fields.name' },
    })
  }

  return saveFounder({
    id,
    name: body.name.trim(),
    school: body.school?.trim() || undefined,
  })
})
