import { describe, expect, it } from 'vitest'
import {
  collectUniqueGrades,
  collectUniqueStudentClasses,
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

describe('collectUniqueStudentClasses', () => {
  const schools = [
    {
      id: 'school-1',
      name: 'School',
      branch: 'Main',
      classes: [
        { id: 'class-7-1', grade: '7', classNumber: 1 },
        { id: 'class-7-2', grade: '7', classNumber: 2 },
        { id: 'class-8-1', grade: '8', classNumber: 1 },
      ],
    },
  ]

  it('returns unique class labels for students', () => {
    expect(collectUniqueStudentClasses([
      { schoolId: 'school-1', classId: 'class-7-2', grade: '7' },
      { schoolId: 'school-1', classId: 'class-7-1', grade: '7' },
      { schoolId: 'school-1', classId: 'class-7-1', grade: '7' },
      { schoolId: 'school-1', classId: '', grade: '7' },
      { schoolId: 'school-1', classId: 'missing', grade: '7' },
    ], schools)).toEqual([
      { id: 'class-7-1', label: '7-1' },
      { id: 'class-7-2', label: '7-2' },
    ])
  })

  it('filters by selected grade', () => {
    expect(collectUniqueStudentClasses([
      { schoolId: 'school-1', classId: 'class-7-1', grade: '7' },
      { schoolId: 'school-1', classId: 'class-8-1', grade: '8' },
    ], schools, '8')).toEqual([
      { id: 'class-8-1', label: '8-1' },
    ])
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
