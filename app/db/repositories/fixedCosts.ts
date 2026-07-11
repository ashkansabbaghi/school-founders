import type { FixedCost } from '#shared/types/financial'
import { db } from '../database'

export async function listFixedCosts(filters?: {
  schoolId?: string
  termYear?: string
}): Promise<FixedCost[]> {
  let costs = await db.fixedCosts.toArray()

  if (filters?.schoolId) {
    costs = costs.filter(cost => cost.schoolId === filters.schoolId)
  }

  if (filters?.termYear) {
    costs = costs.filter(cost => cost.termYear === filters.termYear)
  }

  return costs
}

export async function getFixedCost(id: string): Promise<FixedCost | null> {
  return (await db.fixedCosts.get(id)) ?? null
}
