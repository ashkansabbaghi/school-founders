import { describe, expect, it } from 'vitest'
import {
  collectUniqueGrades,
  indexTransactionsByPersonId,
  matchesSelectFilter,
} from '~/utils/listFilters'

describe('collectUniqueGrades', () => {
  it('returns unique sorted grades', () => {
    expect(collectUniqueGrades([
      { grade: '10' },
      { grade: '7' },
      { grade: '10' },
      { grade: '  8  ' },
      { grade: '' },
    ])).toEqual(['7', '8', '10'])
  })
})

describe('matchesSelectFilter', () => {
  it('matches when no filter is selected', () => {
    expect(matchesSelectFilter('paid', '')).toBe(true)
  })

  it('matches only the selected value', () => {
    expect(matchesSelectFilter('paid', 'paid')).toBe(true)
    expect(matchesSelectFilter('partial', 'paid')).toBe(false)
  })
})

describe('indexTransactionsByPersonId', () => {
  it('groups transactions by person id', () => {
    const map = indexTransactionsByPersonId([
      { studentId: 's1', amountPaid: 100 },
      { studentId: 's2', amountPaid: 200 },
      { studentId: 's1', amountPaid: 50 },
    ], 'studentId')

    expect(map.get('s1')).toEqual([
      { studentId: 's1', amountPaid: 100 },
      { studentId: 's1', amountPaid: 50 },
    ])
    expect(map.get('s2')).toEqual([
      { studentId: 's2', amountPaid: 200 },
    ])
  })
})
