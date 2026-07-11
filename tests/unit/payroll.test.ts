import { describe, expect, it } from 'vitest'
import { getEmployeeExpenseSummary, getExpectedPayroll } from '#shared/utils/payroll'

describe('payroll', () => {
  const employee = {
    baseSalary: 28_000_000,
    insuranceCost: 4_200_000,
  }

  it('calculates expected payroll', () => {
    expect(getExpectedPayroll(employee)).toBe(32_200_000)
  })

  it('treats deductions as negative payments', () => {
    const summary = getEmployeeExpenseSummary(employee, [
      { amountPaid: 28_000_000, transactionType: 'salary' },
      { amountPaid: 500_000, transactionType: 'deduction' },
    ])

    expect(summary.paid).toBe(27_500_000)
    expect(summary.remaining).toBe(4_700_000)
    expect(summary.status).toBe('partial')
  })

  it('returns paid when net payroll is covered', () => {
    const summary = getEmployeeExpenseSummary(employee, [
      { amountPaid: 28_000_000, transactionType: 'salary' },
      { amountPaid: 500_000, transactionType: 'deduction' },
      { amountPaid: 4_700_000, transactionType: 'bonus' },
    ])

    expect(summary.paid).toBe(32_200_000)
    expect(summary.status).toBe('paid')
    expect(summary.remaining).toBe(0)
  })
})
