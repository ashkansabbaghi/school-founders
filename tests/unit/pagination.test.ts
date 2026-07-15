import { describe, expect, it } from 'vitest'
import {
  clampPage,
  getPaginationMeta,
  getTotalPages,
  paginate,
} from '~/utils/pagination'

describe('paginate', () => {
  const items = Array.from({ length: 25 }, (_, index) => index + 1)

  it('returns the first page slice', () => {
    expect(paginate(items, 1)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('returns a middle page slice', () => {
    expect(paginate(items, 2)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
  })

  it('returns the last partial page slice', () => {
    expect(paginate(items, 3)).toEqual([21, 22, 23, 24, 25])
  })

  it('returns an empty array for zero items', () => {
    expect(paginate([], 1)).toEqual([])
  })

  it('clamps out-of-range page numbers when slicing', () => {
    expect(paginate(items, 0)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(paginate(items, 99)).toEqual([21, 22, 23, 24, 25])
  })

  it('respects a custom page size', () => {
    expect(paginate(items, 2, 5)).toEqual([6, 7, 8, 9, 10])
  })
})

describe('getTotalPages', () => {
  it('returns zero for empty lists', () => {
    expect(getTotalPages(0)).toBe(0)
    expect(getTotalPages(-1)).toBe(0)
  })

  it('returns one page when items fit exactly', () => {
    expect(getTotalPages(10)).toBe(1)
  })

  it('rounds up for partial final pages', () => {
    expect(getTotalPages(25)).toBe(3)
    expect(getTotalPages(11)).toBe(2)
  })
})

describe('clampPage', () => {
  it('clamps pages below and above the valid range', () => {
    expect(clampPage(0, 25)).toBe(1)
    expect(clampPage(99, 25)).toBe(3)
  })

  it('returns page 1 when there are no items', () => {
    expect(clampPage(5, 0)).toBe(1)
  })
})

describe('getPaginationMeta', () => {
  it('hides pagination when total items fit on one page', () => {
    expect(getPaginationMeta(10, 1)).toMatchObject({
      currentPage: 1,
      totalPages: 1,
      startIndex: 1,
      endIndex: 10,
      hasPrevious: false,
      hasNext: false,
      showPagination: false,
    })
  })

  it('shows pagination when total items exceed one page', () => {
    expect(getPaginationMeta(11, 1)).toMatchObject({
      currentPage: 1,
      totalPages: 2,
      startIndex: 1,
      endIndex: 10,
      hasPrevious: false,
      hasNext: true,
      showPagination: true,
    })
  })

  it('describes a middle page with both navigation directions', () => {
    expect(getPaginationMeta(25, 2)).toMatchObject({
      currentPage: 2,
      totalPages: 3,
      startIndex: 11,
      endIndex: 20,
      hasPrevious: true,
      hasNext: true,
      showPagination: true,
    })
  })

  it('describes the last page when it is partial', () => {
    expect(getPaginationMeta(25, 3)).toMatchObject({
      currentPage: 3,
      totalPages: 3,
      startIndex: 21,
      endIndex: 25,
      hasPrevious: true,
      hasNext: false,
      showPagination: true,
    })
  })

  it('returns zero range values for empty lists', () => {
    expect(getPaginationMeta(0, 1)).toMatchObject({
      currentPage: 1,
      totalPages: 0,
      startIndex: 0,
      endIndex: 0,
      hasPrevious: false,
      hasNext: false,
      showPagination: false,
    })
  })

  it('clamps out-of-range pages in metadata', () => {
    expect(getPaginationMeta(25, 10)).toMatchObject({
      currentPage: 3,
      totalPages: 3,
      startIndex: 21,
      endIndex: 25,
      hasNext: false,
    })
  })
})
