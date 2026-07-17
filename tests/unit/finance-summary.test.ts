import { beforeEach, describe, expect, it } from 'vitest'
import { calculateFinanceSummary } from '~/services/finance'
import { FIXTURE_TERM_YEAR, seedTestData } from '../helpers/fixtures'
import { resetTestDatabase } from '../helpers/db'

describe('calculateFinanceSummary', () => {
  beforeEach(async () => {
    await resetTestDatabase()
    await seedTestData()
  })

  it('aggregates fixture data for the active term year', async () => {
    const summary = await calculateFinanceSummary({ termYear: FIXTURE_TERM_YEAR })

    expect(summary.totalRevenue).toBe(20_250_000)
    expect(summary.totalOperationalExpenses).toBe(45_000_000)
    expect(summary.totalGrossProfit).toBe(-24_750_000)
    expect(summary.totalTax).toBe(0)
    expect(summary.totalReserveFund).toBe(0)
    expect(summary.totalNetProfit).toBe(-24_750_000)
    expect(summary.schools).toHaveLength(1)
    expect(summary.schools[0]?.employeeExpenses).toBe(27_500_000)
    expect(summary.schools[0]?.fixedCosts).toBe(17_500_000)
  })
})
