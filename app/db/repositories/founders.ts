import type { Founder } from '#shared/types/founder'
import { createAppError } from '#shared/errors/appError'
import { assertNonEmptyString } from '#shared/validation/financialValidation'
import { db } from '../database'

export async function listFounders(): Promise<Founder[]> {
  return db.founders.toArray()
}

export async function getFounder(id: string): Promise<Founder | null> {
  return (await db.founders.get(id)) ?? null
}

export async function saveFounder(input: {
  id?: string
  name?: string
  school?: string
}): Promise<Founder> {
  const founder: Founder = {
    id: input.id?.trim() || crypto.randomUUID(),
    name: assertNonEmptyString(input.name, 'name'),
    school: input.school?.trim() || undefined,
  }

  await db.founders.put(founder)
  return founder
}

export async function removeFounder(id: string): Promise<void> {
  const removed = await db.transaction('rw', db.founders, async () => {
    const existing = await db.founders.get(id)

    if (!existing) {
      return false
    }

    await db.founders.delete(id)
    return true
  })

  if (!removed) {
    throw createAppError({ statusCode: 404, statusMessage: 'errors.notFound.founder' })
  }
}
