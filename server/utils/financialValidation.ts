import type {
  Employee,
  EmployeeTransaction,
  EmployeeTransactionType,
  PaymentMethod,
  School,
  Student,
  StudentTransaction,
} from '../types/financial'

const NATIONAL_CODE_PATTERN = /^\d{10}$/
const PHONE_PATTERN = /^0\d{9,10}$/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'bankTransfer', 'cheque']
const EMPLOYEE_TRANSACTION_TYPES: EmployeeTransactionType[] = ['salary', 'bonus', 'deduction']

function fieldKey(field: string): string {
  return `fields.${field}`
}

export function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'errors.validation.required',
      data: { field: fieldKey(field) },
    })
  }

  return value.trim()
}

export function assertPhone(value: unknown, field = 'parentPhone'): string {
  const phone = assertNonEmptyString(value, field)

  if (!PHONE_PATTERN.test(phone)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'errors.validation.phone',
      data: { field: fieldKey(field) },
    })
  }

  return phone
}

export function assertNationalCode(value: unknown, field = 'nationalCode'): string {
  const nationalCode = assertNonEmptyString(value, field)

  if (!NATIONAL_CODE_PATTERN.test(nationalCode)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'errors.validation.nationalCode',
      data: { field: fieldKey(field) },
    })
  }

  return nationalCode
}

export function assertPositiveInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'errors.validation.positiveInteger',
      data: { field: fieldKey(field) },
    })
  }

  return value
}

export function assertNonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'errors.validation.nonNegativeInteger',
      data: { field: fieldKey(field) },
    })
  }

  return value
}

export function assertDiscountRate(value: unknown, field = 'dynamicDiscountRate'): number {
  if (typeof value !== 'number' || value < 0 || value > 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'errors.validation.discountRate',
      data: { field: fieldKey(field) },
    })
  }

  return value
}

export function assertIsoDate(value: unknown, field = 'date'): string {
  const date = assertNonEmptyString(value, field)

  if (!ISO_DATE_PATTERN.test(date)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'errors.validation.isoDate',
      data: { field: fieldKey(field) },
    })
  }

  return date
}

export function assertPaymentMethod(value: unknown): PaymentMethod {
  const paymentMethod = assertNonEmptyString(value, 'paymentMethod') as PaymentMethod

  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'errors.validation.paymentMethod',
      data: { values: PAYMENT_METHODS.join(', ') },
    })
  }

  return paymentMethod
}

export function assertEmployeeTransactionType(value: unknown): EmployeeTransactionType {
  const transactionType = assertNonEmptyString(value, 'transactionType') as EmployeeTransactionType

  if (!EMPLOYEE_TRANSACTION_TYPES.includes(transactionType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'errors.validation.transactionType',
      data: { values: EMPLOYEE_TRANSACTION_TYPES.join(', ') },
    })
  }

  return transactionType
}

export async function assertSchoolExists(schoolId: string): Promise<void> {
  const school = await getById<School>('schools.json', schoolId)

  if (!school) {
    throw createError({
      statusCode: 400,
      statusMessage: 'errors.notFound.schoolId',
      data: { schoolId },
    })
  }
}

export async function assertStudentExists(studentId: string): Promise<Student> {
  const student = await getById<Student>('students.json', studentId)

  if (!student) {
    throw createError({
      statusCode: 400,
      statusMessage: 'errors.notFound.studentId',
      data: { studentId },
    })
  }

  return student
}

export async function assertEmployeeExists(employeeId: string): Promise<Employee> {
  const employee = await getById<Employee>('employees.json', employeeId)

  if (!employee) {
    throw createError({
      statusCode: 400,
      statusMessage: 'errors.notFound.employeeId',
      data: { employeeId },
    })
  }

  return employee
}

export async function assertNoSchoolDependents(schoolId: string): Promise<void> {
  const [students, employees, studentTransactions, employeeTransactions] = await Promise.all([
    readCollection<Student>('students.json'),
    readCollection<Employee>('employees.json'),
    readCollection<StudentTransaction>('studentTransactions.json'),
    readCollection<EmployeeTransaction>('employeeTransactions.json'),
  ])

  if (students.some(student => student.schoolId === schoolId)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'errors.conflict.schoolHasStudents',
    })
  }

  if (employees.some(employee => employee.schoolId === schoolId)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'errors.conflict.schoolHasEmployees',
    })
  }

  if (studentTransactions.some(transaction => transaction.schoolId === schoolId)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'errors.conflict.schoolHasStudentTransactions',
    })
  }

  if (employeeTransactions.some(transaction => transaction.schoolId === schoolId)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'errors.conflict.schoolHasEmployeeTransactions',
    })
  }
}

export async function assertNoStudentDependents(studentId: string): Promise<void> {
  const transactions = await readCollection<StudentTransaction>('studentTransactions.json')

  if (transactions.some(transaction => transaction.studentId === studentId)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'errors.conflict.studentHasTransactions',
    })
  }
}

export async function assertNoEmployeeDependents(employeeId: string): Promise<void> {
  const transactions = await readCollection<EmployeeTransaction>('employeeTransactions.json')

  if (transactions.some(transaction => transaction.employeeId === employeeId)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'errors.conflict.employeeHasTransactions',
    })
  }
}

export async function assertUniqueStudentNationalCode(
  nationalCode: string,
  excludeId?: string,
): Promise<void> {
  const students = await readCollection<Student>('students.json')
  const duplicate = students.find(
    student => student.nationalCode === nationalCode && student.id !== excludeId?.trim(),
  )

  if (duplicate) {
    throw createError({
      statusCode: 409,
      statusMessage: 'errors.conflict.duplicateStudentNationalCode',
      data: { nationalCode },
    })
  }
}

export async function assertUniqueEmployeeNationalCode(
  nationalCode: string,
  excludeId?: string,
): Promise<void> {
  const employees = await readCollection<Employee>('employees.json')
  const duplicate = employees.find(
    employee => employee.nationalCode === nationalCode && employee.id !== excludeId?.trim(),
  )

  if (duplicate) {
    throw createError({
      statusCode: 409,
      statusMessage: 'errors.conflict.duplicateEmployeeNationalCode',
      data: { nationalCode },
    })
  }
}
