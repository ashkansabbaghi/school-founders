import type {
  Employee,
  EmployeeExpenseStatus,
  EmployeeExpenseSummary,
  EmployeeTransaction,
} from '../types/financial'

function transactionNetAmount(transaction: Pick<EmployeeTransaction, 'amountPaid' | 'transactionType'>): number {
  return transaction.transactionType === 'deduction'
    ? -transaction.amountPaid
    : transaction.amountPaid
}

export function getExpectedPayroll(employee: Pick<Employee, 'baseSalary' | 'insuranceCost'>): number {
  return employee.baseSalary + employee.insuranceCost
}

export function getEmployeeExpenseSummary(
  employee: Pick<Employee, 'baseSalary' | 'insuranceCost'>,
  transactions: Pick<EmployeeTransaction, 'amountPaid' | 'transactionType'>[],
): EmployeeExpenseSummary {
  const expected = getExpectedPayroll(employee)
  const paid = transactions.reduce((sum, transaction) => sum + transactionNetAmount(transaction), 0)
  const remaining = Math.max(0, expected - paid)

  let status: EmployeeExpenseStatus = 'unpaid'
  if (paid >= expected) {
    status = 'paid'
  }
  else if (paid > 0) {
    status = 'partial'
  }

  return { expected, paid, remaining, status }
}
