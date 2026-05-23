import type {
  EmployeeTransaction,
  FinanceSummary,
  SchoolProfitBreakdown,
} from '../types/financial'

export const TAX_RATE = 0.05
export const RESERVE_RATE = 0.10

function employeeExpenseAmount(transaction: EmployeeTransaction): number {
  return transaction.transactionType === 'deduction'
    ? -transaction.amountPaid
    : transaction.amountPaid
}

function createEmptyBreakdown(
  schoolId: string,
  schoolName: string,
  branch: string,
): SchoolProfitBreakdown {
  return {
    schoolId,
    schoolName,
    branch,
    revenue: 0,
    employeeExpenses: 0,
    fixedCosts: 0,
    operationalExpenses: 0,
    grossProfit: 0,
    tax: 0,
    reserveFund: 0,
    netProfit: 0,
  }
}

function finalizeBreakdown(breakdown: SchoolProfitBreakdown): SchoolProfitBreakdown {
  breakdown.operationalExpenses = breakdown.employeeExpenses + breakdown.fixedCosts
  breakdown.grossProfit = breakdown.revenue - breakdown.operationalExpenses

  if (breakdown.grossProfit > 0) {
    breakdown.tax = Math.round(breakdown.grossProfit * TAX_RATE)
    breakdown.reserveFund = Math.round(breakdown.grossProfit * RESERVE_RATE)
  }
  else {
    breakdown.tax = 0
    breakdown.reserveFund = 0
  }

  breakdown.netProfit = breakdown.grossProfit - breakdown.tax - breakdown.reserveFund
  return breakdown
}

export async function calculateFinanceSummary(filters?: {
  termYear?: string
}): Promise<FinanceSummary> {
  const termYear = filters?.termYear?.trim()

  const [schools, studentTransactions, employeeTransactions, fixedCosts] = await Promise.all([
    listSchools(),
    listStudentTransactions(termYear ? { termYear } : undefined),
    listEmployeeTransactions(termYear ? { termYear } : undefined),
    listFixedCosts(termYear ? { termYear } : undefined),
  ])

  const breakdownBySchool = new Map<string, SchoolProfitBreakdown>()

  for (const school of schools) {
    breakdownBySchool.set(
      school.id,
      createEmptyBreakdown(school.id, school.name, school.branch),
    )
  }

  for (const transaction of studentTransactions) {
    const breakdown = breakdownBySchool.get(transaction.schoolId)

    if (!breakdown) {
      continue
    }

    breakdown.revenue += transaction.amountPaid
  }

  for (const transaction of employeeTransactions) {
    const breakdown = breakdownBySchool.get(transaction.schoolId)

    if (!breakdown) {
      continue
    }

    breakdown.employeeExpenses += employeeExpenseAmount(transaction)
  }

  for (const cost of fixedCosts) {
    const breakdown = breakdownBySchool.get(cost.schoolId)

    if (!breakdown) {
      continue
    }

    breakdown.fixedCosts += cost.amount
  }

  const schoolBreakdowns = [...breakdownBySchool.values()].map(finalizeBreakdown)

  return {
    totalRevenue: schoolBreakdowns.reduce((sum, school) => sum + school.revenue, 0),
    totalOperationalExpenses: schoolBreakdowns.reduce(
      (sum, school) => sum + school.operationalExpenses,
      0,
    ),
    totalGrossProfit: schoolBreakdowns.reduce((sum, school) => sum + school.grossProfit, 0),
    totalTax: schoolBreakdowns.reduce((sum, school) => sum + school.tax, 0),
    totalReserveFund: schoolBreakdowns.reduce((sum, school) => sum + school.reserveFund, 0),
    totalNetProfit: schoolBreakdowns.reduce((sum, school) => sum + school.netProfit, 0),
    schools: schoolBreakdowns,
  }
}
