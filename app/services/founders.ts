import type { Founder } from '#shared/types/founder'
import {
  listFounders,
  removeFounder,
  saveFounder,
} from '~/db'

export async function fetchFounders(): Promise<Founder[]> {
  return listFounders()
}

export async function createFounder(payload: Pick<Founder, 'name' | 'school'>): Promise<Founder> {
  return saveFounder(payload)
}

export async function updateFounder(
  id: string,
  payload: Pick<Founder, 'name' | 'school'>,
): Promise<Founder> {
  return saveFounder({ ...payload, id })
}

export async function deleteFounder(id: string): Promise<void> {
  return removeFounder(id)
}
