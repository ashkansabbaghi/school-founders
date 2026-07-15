import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import {
  clampPage,
  getPaginationMeta,
  paginate,
  type PaginationMeta,
} from '~/utils/pagination'

export function usePagination<T>(items: MaybeRefOrGetter<readonly T[]>) {
  const currentPage = ref(1)

  const totalItems = computed(() => toValue(items).length)

  watch(totalItems, () => {
    currentPage.value = 1
  })

  const meta = computed<PaginationMeta>(() =>
    getPaginationMeta(totalItems.value, currentPage.value),
  )

  watch(
    () => meta.value.totalPages,
    (totalPages) => {
      if (totalPages > 0 && currentPage.value > totalPages) {
        currentPage.value = totalPages
      }
    },
  )

  const paginatedItems = computed(() =>
    paginate(toValue(items), currentPage.value),
  )

  function goToPage(page: number) {
    currentPage.value = clampPage(page, totalItems.value)
  }

  function goNext() {
    if (meta.value.hasNext) {
      currentPage.value += 1
    }
  }

  function goPrevious() {
    if (meta.value.hasPrevious) {
      currentPage.value -= 1
    }
  }

  return {
    paginatedItems,
    meta,
    currentPage,
    goNext,
    goPrevious,
    goToPage,
  }
}
