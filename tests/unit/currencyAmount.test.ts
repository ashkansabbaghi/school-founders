import { describe, expect, it } from 'vitest'
import {
  formatAmountDisplay,
  formatAmountInPersianWords,
  parseAmountDigits,
} from '#shared/utils/currencyAmount'

describe('currencyAmount', () => {
  describe('parseAmountDigits', () => {
    it('extracts digits from formatted input', () => {
      expect(parseAmountDigits('3,200,000')).toBe(3_200_000)
      expect(parseAmountDigits('۳٬۲۰۰٬۰۰۰')).toBe(3_200_000)
    })

    it('returns empty string for blank input', () => {
      expect(parseAmountDigits('')).toBe('')
      expect(parseAmountDigits('   ')).toBe('')
    })
  })

  describe('formatAmountDisplay', () => {
    it('formats amounts with locale-specific separators', () => {
      expect(formatAmountDisplay(3_200_000, 'en')).toBe('3,200,000')
      expect(formatAmountDisplay(3_200_000, 'fa')).toBe('۳٬۲۰۰٬۰۰۰')
    })

    it('returns empty string for empty values', () => {
      expect(formatAmountDisplay('', 'en')).toBe('')
    })
  })

  describe('formatAmountInPersianWords', () => {
    it('converts rial amounts to Persian words in tomans', () => {
      expect(formatAmountInPersianWords(150_000_000)).toBe('پانزده میلیون تومان')
      expect(formatAmountInPersianWords(3_200_000)).toBe('سیصد و بیست هزار تومان')
      expect(formatAmountInPersianWords(1_000_000)).toBe('صد هزار تومان')
      expect(formatAmountInPersianWords(500)).toBe('پنجاه تومان')
    })

    it('handles small edge cases', () => {
      expect(formatAmountInPersianWords(0)).toBe('')
      expect(formatAmountInPersianWords(1)).toBe('')
      expect(formatAmountInPersianWords(21)).toBe('دو تومان')
    })

    it('handles large amounts', () => {
      expect(formatAmountInPersianWords(1_000_000_000)).toBe('صد میلیون تومان')
      expect(formatAmountInPersianWords(1_234_567_890)).toBe(
        'صد و بیست و سه میلیون و چهارصد و پنجاه و شش هزار و هفتصد و هشتاد و نه تومان',
      )
    })
  })
})
