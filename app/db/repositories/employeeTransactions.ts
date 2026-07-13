import type { EmployeeTransaction } from '#shared/types/financial'
import { createAppError } from '#shared/errors/appError'
import {
  assertEmployeeTransactionType,
  assertIsoDate,
  assertNonEmptyString,
  assertPositiveInteger,
} from '#shared/validation/financialValidation'
import { db } from '../database'
import {
  assertEmployeeExists,
  assertSchoolExists,
} from '../validation'

export async function listEmployeeTransactions(filters?: {
  schoolId?: string
  employeeId?: string
  transactionType?: string
  termYear?: string
}): Promise<EmployeeTransaction[]> {
  const { schoolId, employeeId, transactionType, termYear } = filters ?? {}

  if (!employeeId && !schoolId && !termYear && !transactionType) {
    return db.employeeTransactions.toArray()
  }

  if (employeeId) {
    let collection = db.employeeTransactions.where('employeeId').equals(employeeId)
    if (schoolId) {
      collection = collection.filter(transaction => transaction.schoolId === schoolId)
    }
    if (termYear) {
      collection = collection.filter(transaction => transaction.termYear === termYear)
    }
    if (transactionType) {
      collection = collection.filter(transaction => transaction.transactionType === transactionType)
    }
    return collection.toArray()
  }

  if (schoolId) {
    let collection = db.employeeTransactions.where('schoolId').equals(schoolId)
    if (termYear) {
      collection = collection.filter(transaction => transaction.termYear === termYear)
    }
    if (transactionType) {
      collection = collection.filter(transaction => transaction.transactionType === transactionType)
    }
    return collection.toArray()
  }

  if (termYear) {
    let collection = db.employeeTransactions.where('termYear').equals(termYear)
    if (transactionType) {
      collection = collection.filter(transaction => transaction.transactionType === transactionType)
    }
    return collection.toArray()
  }

  return db.employeeTransactions
    .filter(transaction => transaction.transactionType === transactionType)
    .toArray()
}

export async function getEmployeeTransaction(id: string): Promise<EmployeeTransaction | null> {
  return (await db.employeeTransactions.get(id)) ?? null
}

export async function saveEmployeeTransaction(input: {
  id?: string
  employeeId?: string
  schoolId?: string
  amountPaid?: number
  transactionType?: string
  date?: string
  termYear?: string
  operator?: string
}): Promise<EmployeeTransaction> {
  const employeeId = assertNonEmptyString(input.employeeId, 'employeeId')
  const employee = await assertEmployeeExists(employeeId)

  const schoolId = assertNonEmptyString(input.schoolId, 'schoolId')
  await assertSchoolExists(schoolId)

  if (employee.schoolId !== schoolId) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.relation.employeeNotInSchool',
    })
  }

  const existing = input.id?.trim() ? await getEmployeeTransaction(input.id.trim()) : null

  const transaction: EmployeeTransaction = {
    id: input.id?.trim() || crypto.randomUUID(),
    employeeId,
    schoolId,
    amountPaid: assertPositiveInteger(input.amountPaid, 'amountPaid'),
    transactionType: assertEmployeeTransactionType(input.transactionType),
    date: assertIsoDate(input.date),
    termYear: assertNonEmptyString(input.termYear, 'termYear'),
    operator: assertNonEmptyString(input.operator, 'operator'),
    loggedAt: existing?.loggedAt ?? new Date().toISOString(),
  }

  await db.employeeTransactions.put(transaction)
  return transaction
}

export async function removeEmployeeTransaction(id: string): Promise<void> {
  const removed = await db.transaction('rw', db.employeeTransactions, async () => {
    const existing = await db.employeeTransactions.get(id)

    if (!existing) {
      return false
    }

    await db.employeeTransactions.delete(id)
    return true
  })

  if (!removed) {
    throw createAppError({ statusCode: 404, statusMessage: 'errors.notFound.employeeTransaction' })
  }
}
