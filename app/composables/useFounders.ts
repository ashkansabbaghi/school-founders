import type { Founder } from '#shared/types/founder'
import {
  createFounder as createFounderRecord,
  deleteFounder as deleteFounderRecord,
  fetchFounders,
  updateFounder as updateFounderRecord,
} from '~/services/founders'

type FoundersStatus = 'idle' | 'loading' | 'error'

export function useFounders() {
  const founders = useState<Founder[]>('founders', () => [])
  const status = useState<FoundersStatus>('founders-status', () => 'idle')

  async function refresh() {
    status.value = 'loading'

    try {
      founders.value = await fetchFounders()
      status.value = 'idle'
    }
    catch {
      status.value = 'error'
      throw new Error('Failed to load founders')
    }
  }

  async function createFounder(payload: Pick<Founder, 'name' | 'school'>) {
    const founder = await createFounderRecord(payload)
    await refresh()
    return founder
  }

  async function updateFounder(id: string, payload: Pick<Founder, 'name' | 'school'>) {
    await updateFounderRecord(id, payload)
    await refresh()
  }

  async function deleteFounder(id: string) {
    await deleteFounderRecord(id)
    await refresh()
  }

  if (import.meta.client && status.value === 'idle' && founders.value.length === 0) {
    void refresh()
  }

  return {
    founders,
    status,
    refresh,
    createFounder,
    updateFounder,
    deleteFounder,
  }
}
