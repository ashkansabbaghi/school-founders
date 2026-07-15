const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

const ONES = [
  '',
  'یک',
  'دو',
  'سه',
  'چهار',
  'پنج',
  'شش',
  'هفت',
  'هشت',
  'نه',
  'ده',
  'یازده',
  'دوازده',
  'سیزده',
  'چهارده',
  'پانزده',
  'شانزده',
  'هفده',
  'هجده',
  'نوزده',
] as const

const TENS = [
  '',
  '',
  'بیست',
  'سی',
  'چهل',
  'پنجاه',
  'شصت',
  'هفتاد',
  'هشتاد',
  'نود',
] as const

const HUNDREDS = [
  '',
  'صد',
  'دویست',
  'سیصد',
  'چهارصد',
  'پانصد',
  'ششصد',
  'هفتصد',
  'هشتصد',
  'نهصد',
] as const

const SCALES = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'] as const

function normalizeDigits(raw: string): string {
  return raw
    .replace(/[۰-۹]/g, digit => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/\D/g, '')
}

export function parseAmountDigits(raw: string): number | '' {
  const digits = normalizeDigits(raw)

  if (!digits) {
    return ''
  }

  const value = Number(digits)

  if (!Number.isFinite(value)) {
    return ''
  }

  return value
}

export function formatAmountDisplay(value: number | '', locale: 'fa' | 'en'): string {
  if (value === '') {
    return ''
  }

  if (!Number.isFinite(value)) {
    return ''
  }

  return new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US').format(value)
}

function threeDigitsToWords(value: number): string {
  if (value === 0) {
    return ''
  }

  const parts: string[] = []
  const hundreds = Math.floor(value / 100)
  const remainder = value % 100

  if (hundreds > 0) {
    parts.push(HUNDREDS[hundreds]!)
  }

  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(ONES[remainder]!)
    }
    else {
      const tens = Math.floor(remainder / 10)
      const ones = remainder % 10

      if (ones > 0) {
        parts.push(`${TENS[tens]!} و ${ONES[ones]!}`)
      }
      else {
        parts.push(TENS[tens]!)
      }
    }
  }

  return parts.join(' و ')
}

export function formatAmountInPersianWords(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return ''
  }

  const intValue = Math.floor(value / 10)

  if (intValue === 0) {
    return ''
  }

  const groups: number[] = []
  let remaining = intValue

  while (remaining > 0) {
    groups.push(remaining % 1000)
    remaining = Math.floor(remaining / 1000)
  }

  const parts: string[] = []

  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const group = groups[index]!

    if (group === 0) {
      continue
    }

    const words = threeDigitsToWords(group)
    const scale = SCALES[index]

    parts.push(scale ? `${words} ${scale}` : words)
  }

  return `${parts.join(' و ')} تومان`
}
