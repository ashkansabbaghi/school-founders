export default defineEventHandler(async (event) => {
  const body = await readBody<{ id?: string, name?: string, school?: string }>(event)

  if (!body.name?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'errors.validation.required',
      data: { field: 'fields.name' },
    })
  }

  const founder = await saveFounder({
    id: body.id?.trim() || crypto.randomUUID(),
    name: body.name.trim(),
    school: body.school?.trim() || undefined,
  })

  setResponseStatus(event, 201)
  return founder
})
