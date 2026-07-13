import { beforeEach, describe, expect, it } from 'vitest'
import { AppError } from '#shared/errors/appError'
import {
  listFixedCosts,
  removeFixedCost,
  saveFixedCost,
} from '~/db/repositories/fixedCosts'
import { saveSchool } from '~/db/repositories/schools'
import { resetTestDatabase } from '../helpers/db'

describe('fixedCosts repository', () => {
  const termYear = '1404-1405'

  beforeEach(async () => {
    await resetTestDatabase()
  })

  it('creates and lists fixed costs for a term', async () => {
    const school = await saveSchool({ name: 'Test School', branch: 'Main' })

    const cost = await saveFixedCost({
      schoolId: school.id,
      label: 'Rent',
      amount: 10_000_000,
      termYear,
    })

    expect(cost.id).toBeTruthy()
    expect(cost.label).toBe('Rent')
    expect(cost.amount).toBe(10_000_000)

    const costs = await listFixedCosts({ termYear })
    expect(costs).toHaveLength(1)
    expect(costs[0]?.label).toBe('Rent')
  })

  it('updates an existing fixed cost', async () => {
    const school = await saveSchool({ name: 'Test School', branch: 'Main' })
    const cost = await saveFixedCost({
      schoolId: school.id,
      label: 'Rent',
      amount: 10_000_000,
      termYear,
    })

    const updated = await saveFixedCost({
      id: cost.id,
      schoolId: school.id,
      label: 'Utilities',
      amount: 2_500_000,
      termYear,
    })

    expect(updated.id).toBe(cost.id)
    expect(updated.label).toBe('Utilities')
    expect(updated.amount).toBe(2_500_000)
  })

  it('rejects invalid fixed cost fields', async () => {
    const school = await saveSchool({ name: 'Test School', branch: 'Main' })

    await expect(saveFixedCost({
      schoolId: school.id,
      label: '   ',
      amount: 100,
      termYear,
    })).rejects.toThrow(AppError)

    await expect(saveFixedCost({
      schoolId: school.id,
      label: 'Rent',
      amount: 0,
      termYear,
    })).rejects.toThrow(AppError)
  })

  it('throws when deleting a missing fixed cost', async () => {
    await expect(removeFixedCost('missing-id')).rejects.toMatchObject({
      statusMessage: 'errors.notFound.fixedCost',
    })
  })
})
