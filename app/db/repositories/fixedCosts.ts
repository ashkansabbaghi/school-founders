import type { FixedCost } from '#shared/types/financial'
import { createAppError } from '#shared/errors/appError'
import {
  assertNonEmptyString,
  assertPositiveInteger,
} from '#shared/validation/financialValidation'
import { db } from '../database'
import { assertSchoolExists } from '../validation'

export async function listFixedCosts(filters?: {
  schoolId?: string
  termYear?: string
}): Promise<FixedCost[]> {
  const { schoolId, termYear } = filters ?? {}

  if (!schoolId && !termYear) {
    return db.fixedCosts.toArray()
  }

  if (schoolId) {
    let collection = db.fixedCosts.where('schoolId').equals(schoolId)
    if (termYear) {
      collection = collection.filter(cost => cost.termYear === termYear)
    }
    return collection.toArray()
  }

  return db.fixedCosts.where('termYear').equals(termYear!).toArray()
}

export async function getFixedCost(id: string): Promise<FixedCost | null> {
  return (await db.fixedCosts.get(id)) ?? null
}

export async function saveFixedCost(input: {
  id?: string
  schoolId?: string
  label?: string
  amount?: number
  termYear?: string
}): Promise<FixedCost> {
  const schoolId = assertNonEmptyString(input.schoolId, 'schoolId')
  await assertSchoolExists(schoolId)

  const cost: FixedCost = {
    id: input.id?.trim() || crypto.randomUUID(),
    schoolId,
    label: assertNonEmptyString(input.label, 'label'),
    amount: assertPositiveInteger(input.amount, 'amount'),
    termYear: assertNonEmptyString(input.termYear, 'termYear'),
  }

  await db.fixedCosts.put(cost)
  return cost
}

export async function removeFixedCost(id: string): Promise<void> {
  const removed = await db.transaction('rw', db.fixedCosts, async () => {
    const existing = await db.fixedCosts.get(id)

    if (!existing) {
      return false
    }

    await db.fixedCosts.delete(id)
    return true
  })

  if (!removed) {
    throw createAppError({ statusCode: 404, statusMessage: 'errors.notFound.fixedCost' })
  }
}
