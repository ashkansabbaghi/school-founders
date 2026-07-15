import PersianDate from '@alireza-ab/persian-date'

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isoToJalali(iso: string, format = 'jYYYY/jMM/jDD'): string {
  if (!iso?.trim()) {
    return ''
  }

  const date = new PersianDate(iso, 'gregorian')

  if (!date.isValid()) {
    return iso
  }

  return date.toString(format)
}

export function jalaliToIso(jalali: string): string {
  if (!jalali?.trim()) {
    return ''
  }

  const date = new PersianDate(jalali, 'jalali')

  if (!date.isValid()) {
    return ''
  }

  return date.calendar('gregorian').toString('YYYY-MM-DD')
}

export function todayIso(): string {
  return new PersianDate().calendar('gregorian').toString('YYYY-MM-DD')
}

export function currentJalaliYear(): number {
  return Number(new PersianDate().toString('jYYYY'))
}

export function formatIsoDateDisplay(iso: string, format = 'jD jMMMM jYYYY'): string {
  if (!iso?.trim() || !ISO_DATE_PATTERN.test(iso)) {
    return iso
  }

  return isoToJalali(iso, format)
}

export function parseTermYear(termYear: string): { start: string, end: string } {
  const [start, end] = termYear.split('-')

  return {
    start: start?.trim() ?? '',
    end: end?.trim() ?? '',
  }
}

export function formatTermYear(startYear: string | number): string {
  const start = Number(startYear)

  if (!Number.isFinite(start) || start <= 0) {
    return String(startYear)
  }

  return `${start}-${start + 1}`
}
