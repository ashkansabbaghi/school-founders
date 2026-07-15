export const PAGE_SIZE = 10

export type PaginationMeta = {
  currentPage: number
  totalPages: number
  totalItems: number
  startIndex: number
  endIndex: number
  hasPrevious: boolean
  hasNext: boolean
  showPagination: boolean
}

export function getTotalPages(totalItems: number, pageSize = PAGE_SIZE): number {
  if (totalItems <= 0) {
    return 0
  }

  return Math.ceil(totalItems / pageSize)
}

export function clampPage(page: number, totalItems: number, pageSize = PAGE_SIZE): number {
  if (totalItems <= 0) {
    return 1
  }

  const totalPages = getTotalPages(totalItems, pageSize)
  return Math.min(Math.max(1, page), totalPages)
}

export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize = PAGE_SIZE,
): T[] {
  if (items.length === 0) {
    return []
  }

  const safePage = clampPage(page, items.length, pageSize)
  const start = (safePage - 1) * pageSize

  return items.slice(start, start + pageSize)
}

export function getPaginationMeta(
  totalItems: number,
  page: number,
  pageSize = PAGE_SIZE,
): PaginationMeta {
  const totalPages = getTotalPages(totalItems, pageSize)
  const currentPage = clampPage(page, totalItems, pageSize)
  const showPagination = totalItems > pageSize

  let startIndex = 0
  let endIndex = 0

  if (totalItems > 0) {
    startIndex = (currentPage - 1) * pageSize + 1
    endIndex = Math.min(currentPage * pageSize, totalItems)
  }

  return {
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    hasPrevious: currentPage > 1,
    hasNext: totalPages > 0 && currentPage < totalPages,
    showPagination,
  }
}
