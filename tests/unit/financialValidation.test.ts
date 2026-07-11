import { describe, expect, it } from 'vitest'
import { AppError } from '#shared/errors/appError'
import {
  assertDiscountRate,
  assertEmployeeTransactionType,
  assertIsoDate,
  assertNationalCode,
  assertNonEmptyString,
  assertNonNegativeInteger,
  assertPaymentMethod,
  assertPhone,
  assertPositiveInteger,
} from '#shared/validation/financialValidation'

describe('financialValidation', () => {
  it('assertNonEmptyString rejects blank values', () => {
    expect(() => assertNonEmptyString('  ', 'name')).toThrow(AppError)
    expect(assertNonEmptyString('  Ali  ', 'name')).toBe('Ali')
  })

  it('assertPhone validates Iranian mobile numbers', () => {
    expect(assertPhone('09123456789')).toBe('09123456789')
    expect(() => assertPhone('9123456789')).toThrow(AppError)
  })

  it('assertNationalCode requires ten digits', () => {
    expect(assertNationalCode('1234567890')).toBe('1234567890')
    expect(() => assertNationalCode('123')).toThrow(AppError)
  })

  it('assertPositiveInteger rejects zero and decimals', () => {
    expect(assertPositiveInteger(42, 'amount')).toBe(42)
    expect(() => assertPositiveInteger(0, 'amount')).toThrow(AppError)
    expect(() => assertPositiveInteger(1.5, 'amount')).toThrow(AppError)
  })

  it('assertNonNegativeInteger allows zero', () => {
    expect(assertNonNegativeInteger(0, 'insuranceCost')).toBe(0)
    expect(() => assertNonNegativeInteger(-1, 'insuranceCost')).toThrow(AppError)
  })

  it('assertDiscountRate accepts values between 0 and 1', () => {
    expect(assertDiscountRate(0.15)).toBe(0.15)
    expect(() => assertDiscountRate(1.1)).toThrow(AppError)
  })

  it('assertIsoDate requires YYYY-MM-DD format', () => {
    expect(assertIsoDate('2026-05-23')).toBe('2026-05-23')
    expect(() => assertIsoDate('23-05-2026')).toThrow(AppError)
  })

  it('assertPaymentMethod accepts known methods', () => {
    expect(assertPaymentMethod('bankTransfer')).toBe('bankTransfer')
    expect(() => assertPaymentMethod('crypto')).toThrow(AppError)
  })

  it('assertEmployeeTransactionType accepts known types', () => {
    expect(assertEmployeeTransactionType('deduction')).toBe('deduction')
    expect(() => assertEmployeeTransactionType('advance')).toThrow(AppError)
  })
})
