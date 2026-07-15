import type { School } from '#shared/types/financial'
import {
  createSchool as createSchoolRecord,
  deleteSchool as deleteSchoolRecord,
  fetchSchools,
  updateSchool as updateSchoolRecord,
} from '~/services/schools'
import type { AppToastKind } from '~/composables/useAppToast'
import { translateApiError } from '~/utils/translateApiError'

type SchoolsStatus = 'idle' | 'loading' | 'error'

function getTranslator() {
  const nuxtApp = useNuxtApp()
  return nuxtApp.$i18n.t.bind(nuxtApp.$i18n)
}

function notifyFeedback(kind: AppToastKind, message: string) {
  useAppToast().show(kind, message)
}

export function useSchools() {
  const financeStore = useFinanceStore()
  const schools = useState<School[]>('schools', () => [])
  const status = useState<SchoolsStatus>('schools-status', () => 'idle')
  const error = useState<string | null>('schools-error', () => null)

  async function syncFinanceStore() {
    if (financeStore.initialized) {
      await financeStore.fetchMasterData()
    }
  }

  async function refresh() {
    status.value = 'loading'
    error.value = null

    try {
      schools.value = await fetchSchools()
      status.value = 'idle'
    }
    catch (loadError) {
      status.value = 'error'
      error.value = translateApiError(loadError, getTranslator())
      notifyFeedback('error', error.value)
    }
  }

  async function createSchool(payload: Pick<School, 'name' | 'branch'>) {
    try {
      const school = await createSchoolRecord(payload)
      await refresh()
      await syncFinanceStore()
      notifyFeedback('success', getTranslator()('messages.schoolSaved'))
      return school
    }
    catch (createError) {
      const message = translateApiError(createError, getTranslator())
      notifyFeedback('error', message)
      throw createError
    }
  }

  async function updateSchool(id: string, payload: Pick<School, 'name' | 'branch'>) {
    try {
      const school = await updateSchoolRecord(id, payload)
      await refresh()
      await syncFinanceStore()
      notifyFeedback('success', getTranslator()('messages.schoolSaved'))
      return school
    }
    catch (updateError) {
      const message = translateApiError(updateError, getTranslator())
      notifyFeedback('error', message)
      throw updateError
    }
  }

  async function deleteSchool(id: string) {
    error.value = null

    try {
      await deleteSchoolRecord(id)
      await refresh()
      await syncFinanceStore()
      notifyFeedback('success', getTranslator()('messages.schoolRemoved'))
    }
    catch (deleteError) {
      error.value = translateApiError(deleteError, getTranslator())
      notifyFeedback('error', error.value)
      throw deleteError
    }
  }

  if (import.meta.client && status.value === 'idle' && schools.value.length === 0) {
    void refresh()
  }

  return {
    schools,
    status,
    error,
    refresh,
    createSchool,
    updateSchool,
    deleteSchool,
  }
}
