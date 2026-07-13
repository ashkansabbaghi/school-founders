import type { FixedCost } from '#shared/types/financial'
import {
  listFixedCosts,
  removeFixedCost,
  saveFixedCost,
} from '~/db'

export async function fetchFixedCosts(filters?: {
  schoolId?: string
  termYear?: string
}): Promise<FixedCost[]> {
  return listFixedCosts(filters)
}

export async function createFixedCost(
  payload: Pick<FixedCost, 'schoolId' | 'label' | 'amount' | 'termYear'>,
): Promise<FixedCost> {
  return saveFixedCost(payload)
}

export async function updateFixedCost(
  id: string,
  payload: Pick<FixedCost, 'schoolId' | 'label' | 'amount' | 'termYear'>,
): Promise<FixedCost> {
  return saveFixedCost({ id, ...payload })
}

export async function deleteFixedCost(id: string): Promise<void> {
  return removeFixedCost(id)
}
