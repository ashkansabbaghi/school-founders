export interface Founder {
  id: string
  name: string
  school?: string
}

export function useFounders() {
  const { data: founders, refresh, status } = useFetch<Founder[]>('/api/founders', {
    default: () => [],
  })

  async function createFounder(payload: Pick<Founder, 'name' | 'school'>) {
    await $fetch('/api/founders', {
      method: 'POST',
      body: payload,
    })
    await refresh()
  }

  async function updateFounder(id: string, payload: Pick<Founder, 'name' | 'school'>) {
    await $fetch(`/api/founders/${id}`, {
      method: 'PUT',
      body: payload,
    })
    await refresh()
  }

  async function deleteFounder(id: string) {
    await $fetch(`/api/founders/${id}`, {
      method: 'DELETE',
    })
    await refresh()
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
