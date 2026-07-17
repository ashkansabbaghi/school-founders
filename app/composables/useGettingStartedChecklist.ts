import type { RouteLocationRaw } from 'vue-router'
import {
  dismissGettingStartedChecklist,
  getGettingStartedProgress,
  shouldShowGettingStartedChecklist,
  type GettingStartedProgress,
} from '~/db/bootstrap'

export type GettingStartedItemId = 'school' | 'student' | 'payment' | 'backup'

export interface GettingStartedItem {
  id: GettingStartedItemId
  done: boolean
  to: RouteLocationRaw
}

const ITEM_ROUTES: Record<GettingStartedItemId, RouteLocationRaw> = {
  school: '/schools',
  student: '/students',
  payment: { path: '/finance', query: { tab: 'studentPayments' } },
  backup: '/settings',
}

const ITEM_IDS: GettingStartedItemId[] = ['school', 'student', 'payment', 'backup']

function buildItems(progress: GettingStartedProgress): GettingStartedItem[] {
  return ITEM_IDS.map(id => ({
    id,
    done: progress[id],
    to: ITEM_ROUTES[id],
  }))
}

export function useGettingStartedChecklist() {
  const financeStore = useFinanceStore()

  const visible = ref(false)
  const items = ref<GettingStartedItem[]>([])
  const completedCount = ref(0)
  const totalCount = ref(4)

  const progressPercent = computed(() => {
    if (totalCount.value <= 0) {
      return 0
    }

    return Math.min(100, (completedCount.value / totalCount.value) * 100)
  })

  async function refresh() {
    const shouldShow = await shouldShowGettingStartedChecklist()

    if (!shouldShow) {
      visible.value = false
      return
    }

    const progress = await getGettingStartedProgress()

    if (progress.allComplete) {
      await dismissGettingStartedChecklist()
      visible.value = false
      items.value = buildItems(progress)
      completedCount.value = progress.completedCount
      totalCount.value = progress.totalCount
      return
    }

    items.value = buildItems(progress)
    completedCount.value = progress.completedCount
    totalCount.value = progress.totalCount
    visible.value = true
  }

  async function dismiss() {
    await dismissGettingStartedChecklist()
    visible.value = false
  }

  onMounted(() => {
    void refresh()
  })

  watch(
    () => financeStore.onboardingComplete,
    (complete) => {
      if (complete) {
        void refresh()
      }
    },
  )

  watch(
    () => [financeStore.schools.length, financeStore.students.length] as const,
    () => {
      void refresh()
    },
  )

  return {
    visible,
    items,
    completedCount,
    totalCount,
    progressPercent,
    refresh,
    dismiss,
  }
}
