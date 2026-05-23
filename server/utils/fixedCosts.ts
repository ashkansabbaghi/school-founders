import type { FixedCost } from '../types/financial'

const FILE = 'fixedCosts.json'

export async function listFixedCosts(filters?: {
  schoolId?: string
  termYear?: string
}): Promise<FixedCost[]> {
  let costs = await readCollection<FixedCost>(FILE)

  if (filters?.schoolId) {
    costs = costs.filter(cost => cost.schoolId === filters.schoolId)
  }

  if (filters?.termYear) {
    costs = costs.filter(cost => cost.termYear === filters.termYear)
  }

  return costs
}

export async function getFixedCost(id: string): Promise<FixedCost | null> {
  return getById<FixedCost>(FILE, id)
}
