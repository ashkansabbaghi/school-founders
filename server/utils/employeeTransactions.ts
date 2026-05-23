import type { EmployeeTransaction } from '../types/financial'

const FILE = 'employeeTransactions.json'

export async function listEmployeeTransactions(filters?: {
  schoolId?: string
  employeeId?: string
  transactionType?: string
  termYear?: string
}): Promise<EmployeeTransaction[]> {
  let transactions = await readCollection<EmployeeTransaction>(FILE)

  if (filters?.schoolId) {
    transactions = transactions.filter(transaction => transaction.schoolId === filters.schoolId)
  }

  if (filters?.employeeId) {
    transactions = transactions.filter(transaction => transaction.employeeId === filters.employeeId)
  }

  if (filters?.transactionType) {
    transactions = transactions.filter(
      transaction => transaction.transactionType === filters.transactionType,
    )
  }

  if (filters?.termYear) {
    transactions = transactions.filter(transaction => transaction.termYear === filters.termYear)
  }

  return transactions
}

export async function getEmployeeTransaction(id: string): Promise<EmployeeTransaction | null> {
  return getById<EmployeeTransaction>(FILE, id)
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
    throw createError({
      statusCode: 400,
      statusMessage: 'errors.relation.employeeNotInSchool',
    })
  }

  const transaction: EmployeeTransaction = {
    id: input.id?.trim() || crypto.randomUUID(),
    employeeId,
    schoolId,
    amountPaid: assertPositiveInteger(input.amountPaid, 'amountPaid'),
    transactionType: assertEmployeeTransactionType(input.transactionType),
    date: assertIsoDate(input.date),
    termYear: assertNonEmptyString(input.termYear, 'termYear'),
    operator: assertNonEmptyString(input.operator, 'operator'),
  }

  return upsertById(FILE, transaction)
}

export async function removeEmployeeTransaction(id: string): Promise<void> {
  const removed = await removeById<EmployeeTransaction>(FILE, id)

  if (!removed) {
    throw createError({ statusCode: 404, statusMessage: 'errors.notFound.employeeTransaction' })
  }
}
