import { describe, expect, it } from 'vitest'
import {
  allocateUniqueFolderName,
  toAccountFolderName,
} from '#shared/types/account'

describe('toAccountFolderName', () => {
  it('preserves Persian letters and replaces spaces with dashes', () => {
    expect(toAccountFolderName('علی رضایی')).toBe('علی-رضایی')
    expect(toAccountFolderName('  مدرسه   پردیسان  ')).toBe('مدرسه-پردیسان')
  })

  it('strips path-invalid characters', () => {
    expect(toAccountFolderName('a/b\\c:d*e?f"g<h>i|j')).toBe('abcdefghij')
    expect(toAccountFolderName('name\u0000with\u001fcontrols')).toBe('namewithcontrols')
  })

  it('collapses dot sequences and trims leading/trailing dots and dashes', () => {
    expect(toAccountFolderName('..hidden..')).toBe('hidden')
    expect(toAccountFolderName('a...b')).toBe('a.b')
    expect(toAccountFolderName('-dashed-')).toBe('dashed')
  })

  it('falls back to "account" when nothing survives sanitization', () => {
    expect(toAccountFolderName('')).toBe('account')
    expect(toAccountFolderName('   ')).toBe('account')
    expect(toAccountFolderName('/\\:*?"<>|')).toBe('account')
    expect(toAccountFolderName('...')).toBe('account')
  })

  it('truncates names longer than 80 characters', () => {
    const long = 'x'.repeat(200)
    expect(toAccountFolderName(long)).toBe('x'.repeat(80))
    expect(toAccountFolderName(long).length).toBeLessThanOrEqual(80)
  })
})

describe('allocateUniqueFolderName', () => {
  it('returns the sanitized base name when unused', () => {
    expect(allocateUniqueFolderName('علی رضایی', [])).toBe('علی-رضایی')
  })

  it('appends numeric suffixes on collision', () => {
    expect(allocateUniqueFolderName('Ali', ['Ali'])).toBe('Ali-2')
    expect(allocateUniqueFolderName('Ali', ['Ali', 'Ali-2'])).toBe('Ali-3')
  })

  it('detects collisions after sanitization', () => {
    expect(allocateUniqueFolderName('Ali*', ['Ali'])).toBe('Ali-2')
    expect(allocateUniqueFolderName('علی رضایی', ['علی-رضایی'])).toBe('علی-رضایی-2')
  })
})
