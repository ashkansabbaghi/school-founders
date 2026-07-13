import type { School } from '#shared/types/financial'
import {
  listSchools,
  removeSchool,
  saveSchool,
} from '~/db'

export async function fetchSchools(): Promise<School[]> {
  return listSchools()
}

export async function createSchool(payload: Pick<School, 'name' | 'branch'>): Promise<School> {
  return saveSchool(payload)
}

export async function updateSchool(
  id: string,
  payload: Pick<School, 'name' | 'branch'>,
): Promise<School> {
  return saveSchool({ id, ...payload })
}

export async function deleteSchool(id: string): Promise<void> {
  return removeSchool(id)
}
