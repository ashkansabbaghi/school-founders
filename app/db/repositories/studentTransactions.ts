import type { StudentTransaction } from '#shared/types/financial'
import { createAppError } from '#shared/errors/appError'
import {
  assertIsoDate,
  assertNonEmptyString,
  assertPaymentMethod,
  assertPositiveInteger,
} from '#shared/validation/financialValidation'
import { db } from '../database'
import {
  assertSchoolExists,
  assertStudentExists,
} from '../validation'

export async function listStudentTransactions(filters?: {
  schoolId?: string
  studentId?: string
  termYear?: string
}): Promise<StudentTransaction[]> {
  let transactions = await db.studentTransactions.toArray()

  if (filters?.schoolId) {
    transactions = transactions.filter(transaction => transaction.schoolId === filters.schoolId)
  }

  if (filters?.studentId) {
    transactions = transactions.filter(transaction => transaction.studentId === filters.studentId)
  }

  if (filters?.termYear) {
    transactions = transactions.filter(transaction => transaction.termYear === filters.termYear)
  }

  return transactions
}

export async function getStudentTransaction(id: string): Promise<StudentTransaction | null> {
  return (await db.studentTransactions.get(id)) ?? null
}

export async function saveStudentTransaction(input: {
  id?: string
  studentId?: string
  schoolId?: string
  amountPaid?: number
  paymentMethod?: string
  date?: string
  termYear?: string
  operator?: string
}): Promise<StudentTransaction> {
  const studentId = assertNonEmptyString(input.studentId, 'studentId')
  const student = await assertStudentExists(studentId)

  const schoolId = assertNonEmptyString(input.schoolId, 'schoolId')
  await assertSchoolExists(schoolId)

  if (student.schoolId !== schoolId) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.relation.studentNotInSchool',
    })
  }

  const existing = input.id?.trim() ? await getStudentTransaction(input.id.trim()) : null

  const transaction: StudentTransaction = {
    id: input.id?.trim() || crypto.randomUUID(),
    studentId,
    schoolId,
    amountPaid: assertPositiveInteger(input.amountPaid, 'amountPaid'),
    paymentMethod: assertPaymentMethod(input.paymentMethod),
    date: assertIsoDate(input.date),
    termYear: assertNonEmptyString(input.termYear, 'termYear'),
    operator: assertNonEmptyString(input.operator, 'operator'),
    loggedAt: existing?.loggedAt ?? new Date().toISOString(),
  }

  await db.studentTransactions.put(transaction)
  return transaction
}

export async function removeStudentTransaction(id: string): Promise<void> {
  const removed = await db.transaction('rw', db.studentTransactions, async () => {
    const existing = await db.studentTransactions.get(id)

    if (!existing) {
      return false
    }

    await db.studentTransactions.delete(id)
    return true
  })

  if (!removed) {
    throw createAppError({ statusCode: 404, statusMessage: 'errors.notFound.studentTransaction' })
  }
}
