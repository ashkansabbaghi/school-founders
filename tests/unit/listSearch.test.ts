import { describe, expect, it } from 'vitest'
import { matchesListSearch, normalizeSearchText, splitSearchHighlight } from '~/utils/listSearch'

describe('normalizeSearchText', () => {
  it('trims and lowercases text', () => {
    expect(normalizeSearchText('  Ali Reza  ')).toBe('ali reza')
  })

  it('converts Persian digits to English', () => {
    expect(normalizeSearchText('۰۹۱۲')).toBe('0912')
  })

  it('converts Arabic digits to English', () => {
    expect(normalizeSearchText('٠٩١٢')).toBe('0912')
  })

  it('handles numbers', () => {
    expect(normalizeSearchText(12345)).toBe('12345')
  })

  it('returns empty string for nullish values', () => {
    expect(normalizeSearchText(null)).toBe('')
    expect(normalizeSearchText(undefined)).toBe('')
  })
})

describe('matchesListSearch', () => {
  it('matches all rows when query is empty', () => {
    expect(matchesListSearch('', ['Alice', 'Bob'])).toBe(true)
    expect(matchesListSearch('   ', ['Alice'])).toBe(true)
  })

  it('matches partial text case-insensitively', () => {
    expect(matchesListSearch('ali', ['Ali Reza'])).toBe(true)
    expect(matchesListSearch('REZA', ['ali reza'])).toBe(true)
  })

  it('matches when any searchable value contains the query', () => {
    expect(matchesListSearch('0912', ['Sara', '09123456789'])).toBe(true)
    expect(matchesListSearch('0912', ['Sara', '0999'])).toBe(false)
  })

  it('matches Persian-digit queries against English-digit values', () => {
    expect(matchesListSearch('۰۹۱۲', ['09123456789'])).toBe(true)
  })

  it('matches numeric fields', () => {
    expect(matchesListSearch('42', [42, 'Other Name'])).toBe(true)
  })
})

describe('splitSearchHighlight', () => {
  it('returns a single plain segment when query is empty', () => {
    expect(splitSearchHighlight('Ali Reza', '')).toEqual([
      { text: 'Ali Reza', highlighted: false },
    ])
    expect(splitSearchHighlight('Ali Reza', '   ')).toEqual([
      { text: 'Ali Reza', highlighted: false },
    ])
  })

  it('highlights case-insensitive matches', () => {
    expect(splitSearchHighlight('Ali Reza', 'ali')).toEqual([
      { text: 'Ali', highlighted: true },
      { text: ' Reza', highlighted: false },
    ])
    expect(splitSearchHighlight('ali reza', 'REZA')).toEqual([
      { text: 'ali ', highlighted: false },
      { text: 'reza', highlighted: true },
    ])
  })

  it('highlights Persian-digit queries against English-digit text', () => {
    expect(splitSearchHighlight('09123456789', '۰۹۱۲')).toEqual([
      { text: '0912', highlighted: true },
      { text: '3456789', highlighted: false },
    ])
  })

  it('highlights English-digit queries against Persian-digit text', () => {
    expect(splitSearchHighlight('۰۹۱۲۳۴۵۶۷۸۹', '0912')).toEqual([
      { text: '۰۹۱۲', highlighted: true },
      { text: '۳۴۵۶۷۸۹', highlighted: false },
    ])
  })

  it('highlights multiple non-overlapping occurrences', () => {
    expect(splitSearchHighlight('ababab', 'ab')).toEqual([
      { text: 'ab', highlighted: true },
      { text: 'ab', highlighted: true },
      { text: 'ab', highlighted: true },
    ])
  })

  it('returns a single plain segment when there is no match', () => {
    expect(splitSearchHighlight('Sara', '0912')).toEqual([
      { text: 'Sara', highlighted: false },
    ])
  })

  it('preserves leading and trailing whitespace in display text', () => {
    expect(splitSearchHighlight('  Ali  ', 'ali')).toEqual([
      { text: '  ', highlighted: false },
      { text: 'Ali', highlighted: true },
      { text: '  ', highlighted: false },
    ])
  })

  it('handles nullish values', () => {
    expect(splitSearchHighlight(null, 'test')).toEqual([
      { text: '', highlighted: false },
    ])
    expect(splitSearchHighlight(undefined, '')).toEqual([
      { text: '', highlighted: false },
    ])
  })
})
