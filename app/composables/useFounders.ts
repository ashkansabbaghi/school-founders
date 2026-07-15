import type { Founder } from '#shared/types/founder'
import {
  createFounder as createFounderRecord,
  deleteFounder as deleteFounderRecord,
  fetchFounders,
  updateFounder as updateFounderRecord,
} from '~/services/founders'
import type { AppToastKind } from '~/composables/useAppToast'
import { translateApiError } from '~/utils/translateApiError'

type FoundersStatus = 'idle' | 'loading' | 'error'

function getTranslator() {
  const nuxtApp = useNuxtApp()
  return nuxtApp.$i18n.t.bind(nuxtApp.$i18n)
}

function notifyFeedback(kind: AppToastKind, message: string) {
  useAppToast().show(kind, message)
}

export function useFounders() {
  const founders = useState<Founder[]>('founders', () => [])
  const status = useState<FoundersStatus>('founders-status', () => 'idle')
  const error = useState<string | null>('founders-error', () => null)

  async function refresh() {
    status.value = 'loading'
    error.value = null

    try {
      founders.value = await fetchFounders()
      status.value = 'idle'
    }
    catch (loadError) {
      status.value = 'error'
      error.value = translateApiError(loadError, getTranslator())
      notifyFeedback('error', error.value)
    }
  }

  async function createFounder(payload: Pick<Founder, 'name' | 'school'>) {
    try {
      const founder = await createFounderRecord(payload)
      await refresh()
      notifyFeedback('success', getTranslator()('messages.founderSaved'))
      return founder
    }
    catch (createError) {
      const message = translateApiError(createError, getTranslator())
      notifyFeedback('error', message)
      throw createError
    }
  }

  async function updateFounder(id: string, payload: Pick<Founder, 'name' | 'school'>) {
    await updateFounderRecord(id, payload)
    await refresh()
  }

  async function deleteFounder(id: string) {
    error.value = null

    try {
      await deleteFounderRecord(id)
      await refresh()
      notifyFeedback('success', getTranslator()('messages.founderRemoved'))
    }
    catch (deleteError) {
      error.value = translateApiError(deleteError, getTranslator())
      notifyFeedback('error', error.value)
      throw deleteError
    }
  }

  if (import.meta.client && status.value === 'idle' && founders.value.length === 0) {
    void refresh()
  }

  return {
    founders,
    status,
    error,
    refresh,
    createFounder,
    updateFounder,
    deleteFounder,
  }
}
