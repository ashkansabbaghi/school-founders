import { describe, expect, it } from 'vitest'
import { getExpectedTuition, getStudentPaymentSummary } from '#shared/utils/tuition'

describe('tuition', () => {
  const student = {
    fullPrice: 45_000_000,
    dynamicDiscountRate: 0.10,
  }

  it('calculates expected tuition with discount', () => {
    expect(getExpectedTuition(student)).toBe(40_500_000)
  })

  it('returns unpaid when no payments exist', () => {
    expect(getStudentPaymentSummary(student, [])).toEqual({
      expected: 40_500_000,
      paid: 0,
      remaining: 40_500_000,
      status: 'unpaid',
    })
  })

  it('returns partial when some tuition is paid', () => {
    const summary = getStudentPaymentSummary(student, [{ amountPaid: 20_000_000 }])

    expect(summary.status).toBe('partial')
    expect(summary.paid).toBe(20_000_000)
    expect(summary.remaining).toBe(20_500_000)
  })

  it('returns paid when tuition is fully covered', () => {
    const summary = getStudentPaymentSummary(student, [{ amountPaid: 40_500_000 }])

    expect(summary.status).toBe('paid')
    expect(summary.remaining).toBe(0)
  })
})
