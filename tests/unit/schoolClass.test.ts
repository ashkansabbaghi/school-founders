import { describe, expect, it } from 'vitest'
import {
  findSchoolClass,
  formatClassLabel,
  hasDuplicateClassNumber,
  nextClassNumber,
  normalizeSchoolClasses,
} from '#shared/utils/schoolClass'

describe('schoolClass helpers', () => {
  it('formats class labels as grade-number', () => {
    expect(formatClassLabel('7', 1)).toBe('7-1')
    expect(formatClassLabel('12', 3)).toBe('12-3')
  })

  it('returns the next class number for a grade', () => {
    expect(nextClassNumber([], '7')).toBe(1)
    expect(nextClassNumber([
      { grade: '7', classNumber: 1 },
      { grade: '7', classNumber: 3 },
      { grade: '8', classNumber: 9 },
    ], '7')).toBe(4)
  })

  it('normalizes missing legacy classes to an empty array', () => {
    expect(normalizeSchoolClasses(undefined)).toEqual([])
    expect(normalizeSchoolClasses(null)).toEqual([])
    expect(normalizeSchoolClasses([
      { id: 'c1', grade: '7', classNumber: 1 },
    ])).toEqual([
      { id: 'c1', grade: '7', classNumber: 1 },
    ])
  })

  it('finds a class by id', () => {
    const classes = [
      { id: 'c1', grade: '7', classNumber: 1 },
      { id: 'c2', grade: '8', classNumber: 1 },
    ]

    expect(findSchoolClass(classes, 'c2')).toEqual({ id: 'c2', grade: '8', classNumber: 1 })
    expect(findSchoolClass(classes, 'missing')).toBeUndefined()
    expect(findSchoolClass(undefined, 'c1')).toBeUndefined()
  })

  it('detects duplicate class numbers within a grade', () => {
    const classes = [
      { id: 'c1', grade: '7', classNumber: 1 },
      { id: 'c2', grade: '7', classNumber: 2 },
      { id: 'c3', grade: '8', classNumber: 1 },
    ]

    expect(hasDuplicateClassNumber(classes, '7', 1)).toBe(true)
    expect(hasDuplicateClassNumber(classes, '7', 1, 'c1')).toBe(false)
    expect(hasDuplicateClassNumber(classes, '7', 3)).toBe(false)
    expect(hasDuplicateClassNumber(classes, '8', 1)).toBe(true)
  })
})
