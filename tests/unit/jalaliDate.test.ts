import { describe, expect, it } from 'vitest'
import {
  formatIsoDateDisplay,
  formatTermYear,
  isoToJalali,
  jalaliToIso,
  parseTermYear,
} from '#shared/utils/jalaliDate'

describe('jalaliDate', () => {
  it('converts gregorian ISO to jalali', () => {
    expect(isoToJalali('2026-05-23')).toBe('1405/03/02')
  })

  it('converts jalali to gregorian ISO', () => {
    expect(jalaliToIso('1405/03/02')).toBe('2026-05-23')
  })

  it('formats ISO dates for display', () => {
    expect(formatIsoDateDisplay('2026-05-23')).toContain('1405')
  })

  it('parses and formats academic years', () => {
    expect(parseTermYear('1404-1405')).toEqual({ start: '1404', end: '1405' })
    expect(formatTermYear('1404')).toBe('1404-1405')
  })
})
