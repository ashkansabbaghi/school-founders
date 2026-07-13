import type { FixedCost } from '#shared/types/financial'
import {
  createFixedCost as createFixedCostRecord,
  deleteFixedCost as deleteFixedCostRecord,
  fetchFixedCosts,
  updateFixedCost as updateFixedCostRecord,
} from '~/services/fixedCosts'
import { translateApiError } from '~/utils/translateApiError'

type FixedCostsStatus = 'idle' | 'loading' | 'error'

function getTranslator() {
  const nuxtApp = useNuxtApp()
  return nuxtApp.$i18n.t.bind(nuxtApp.$i18n)
}

export function useFixedCosts() {
  const financeStore = useFinanceStore()
  const fixedCosts = useState<FixedCost[]>('fixed-costs', () => [])
  const status = useState<FixedCostsStatus>('fixed-costs-status', () => 'idle')
  const error = useState<string | null>('fixed-costs-error', () => null)

  async function syncSummary() {
    if (financeStore.initialized) {
      await financeStore.fetchSummary()
    }
  }

  async function refresh() {
    status.value = 'loading'
    error.value = null

    try {
      fixedCosts.value = await fetchFixedCosts({ termYear: financeStore.termYear })
      status.value = 'idle'
    }
    catch (loadError) {
      status.value = 'error'
      error.value = translateApiError(loadError, getTranslator())
    }
  }

  async function createFixedCost(
    payload: Pick<FixedCost, 'schoolId' | 'label' | 'amount'>,
  ) {
    const cost = await createFixedCostRecord({
      ...payload,
      termYear: financeStore.termYear,
    })
    await refresh()
    await syncSummary()
    return cost
  }

  async function updateFixedCost(
    id: string,
    payload: Pick<FixedCost, 'schoolId' | 'label' | 'amount'>,
  ) {
    const cost = await updateFixedCostRecord(id, {
      ...payload,
      termYear: financeStore.termYear,
    })
    await refresh()
    await syncSummary()
    return cost
  }

  async function deleteFixedCost(id: string) {
    error.value = null

    try {
      await deleteFixedCostRecord(id)
      await refresh()
      await syncSummary()
    }
    catch (deleteError) {
      error.value = translateApiError(deleteError, getTranslator())
      throw deleteError
    }
  }

  if (import.meta.client) {
    watch(
      () => financeStore.termYear,
      () => {
        void refresh()
      },
    )

    if (status.value === 'idle' && fixedCosts.value.length === 0) {
      void refresh()
    }
  }

  return {
    fixedCosts,
    status,
    error,
    refresh,
    createFixedCost,
    updateFixedCost,
    deleteFixedCost,
  }
}
