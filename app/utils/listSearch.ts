const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

function normalizeDigitsInText(text: string): string {
  return text
    .replace(/[۰-۹]/g, digit => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String(ARABIC_DIGITS.indexOf(digit)))
}

export function normalizeSearchText(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return ''
  }

  return normalizeDigitsInText(String(value).trim()).toLowerCase()
}

export function matchesListSearch(
  query: string,
  values: Array<string | number | null | undefined>,
): boolean {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return true
  }

  return values.some(value => normalizeSearchText(value).includes(normalizedQuery))
}

export type SearchHighlightSegment = {
  text: string
  highlighted: boolean
}

function normalizeDisplayText(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return ''
  }

  return normalizeDigitsInText(String(value)).toLowerCase()
}

export function splitSearchHighlight(
  value: string | number | null | undefined,
  query: string,
): SearchHighlightSegment[] {
  const text = value === null || value === undefined ? '' : String(value)
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return [{ text, highlighted: false }]
  }

  const normalizedText = normalizeDisplayText(text)
  const matchRanges: Array<[number, number]> = []

  let searchFrom = 0
  while (searchFrom <= normalizedText.length - normalizedQuery.length) {
    const index = normalizedText.indexOf(normalizedQuery, searchFrom)
    if (index === -1) {
      break
    }

    matchRanges.push([index, index + normalizedQuery.length])
    searchFrom = index + normalizedQuery.length
  }

  if (matchRanges.length === 0) {
    return [{ text, highlighted: false }]
  }

  const segments: SearchHighlightSegment[] = []
  let cursor = 0

  for (const [start, end] of matchRanges) {
    if (cursor < start) {
      segments.push({ text: text.slice(cursor, start), highlighted: false })
    }

    segments.push({ text: text.slice(start, end), highlighted: true })
    cursor = end
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlighted: false })
  }

  return segments
}
