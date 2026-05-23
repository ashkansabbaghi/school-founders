import type { School } from '../types/financial'

const FILE = 'schools.json'

export async function listSchools(): Promise<School[]> {
  return readCollection<School>(FILE)
}

export async function getSchool(id: string): Promise<School | null> {
  return getById<School>(FILE, id)
}

export async function saveSchool(input: {
  id?: string
  name?: string
  branch?: string
}): Promise<School> {
  const school: School = {
    id: input.id?.trim() || crypto.randomUUID(),
    name: assertNonEmptyString(input.name, 'name'),
    branch: assertNonEmptyString(input.branch, 'branch'),
  }

  return upsertById(FILE, school)
}

export async function removeSchool(id: string): Promise<void> {
  await assertNoSchoolDependents(id)

  const removed = await removeById<School>(FILE, id)

  if (!removed) {
    throw createError({ statusCode: 404, statusMessage: 'errors.notFound.school' })
  }
}
