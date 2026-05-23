import type { Student, StudentPaymentStatus, StudentPaymentSummary, StudentTransaction } from '../types/financial'

export function getExpectedTuition(student: Pick<Student, 'fullPrice' | 'dynamicDiscountRate'>): number {
  return Math.round(student.fullPrice * (1 - student.dynamicDiscountRate))
}

export function getStudentPaymentSummary(
  student: Pick<Student, 'fullPrice' | 'dynamicDiscountRate'>,
  transactions: Pick<StudentTransaction, 'amountPaid'>[],
): StudentPaymentSummary {
  const expected = getExpectedTuition(student)
  const paid = transactions.reduce((sum, transaction) => sum + transaction.amountPaid, 0)
  const remaining = Math.max(0, expected - paid)

  let status: StudentPaymentStatus = 'unpaid'
  if (paid >= expected) {
    status = 'paid'
  }
  else if (paid > 0) {
    status = 'partial'
  }

  return { expected, paid, remaining, status }
}
