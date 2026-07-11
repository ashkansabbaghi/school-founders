import type { School } from '#shared/types/financial'
import { assertNonEmptyString } from '#shared/validation/financialValidation'
import { db } from '../database'
import {
  assertNoSchoolDependents,
  assertSchoolExists,
} from '../validation'
import { createAppError } from '#shared/errors/appError'

export async function listSchools(): Promise<School[]> {
  return db.schools.toArray()
}

export async function getSchool(id: string): Promise<School | null> {
  return (await db.schools.get(id)) ?? null
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

  await db.schools.put(school)
  return school
}

export async function removeSchool(id: string): Promise<void> {
  await assertNoSchoolDependents(id)

  const removed = await db.transaction('rw', db.schools, async () => {
    const existing = await db.schools.get(id)

    if (!existing) {
      return false
    }

    await db.schools.delete(id)
    return true
  })

  if (!removed) {
    throw createAppError({ statusCode: 404, statusMessage: 'errors.notFound.school' })
  }
}
