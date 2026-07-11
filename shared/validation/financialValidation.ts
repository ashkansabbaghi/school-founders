import { createAppError } from '../errors/appError'
import type {
  EmployeeTransactionType,
  PaymentMethod,
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
    throw createAppError({
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
    throw createAppError({
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
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.validation.nationalCode',
      data: { field: fieldKey(field) },
    })
  }

  return nationalCode
}

export function assertPositiveInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.validation.positiveInteger',
      data: { field: fieldKey(field) },
    })
  }

  return value
}

export function assertNonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.validation.nonNegativeInteger',
      data: { field: fieldKey(field) },
    })
  }

  return value
}

export function assertDiscountRate(value: unknown, field = 'dynamicDiscountRate'): number {
  if (typeof value !== 'number' || value < 0 || value > 1) {
    throw createAppError({
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
    throw createAppError({
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
    throw createAppError({
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
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.validation.transactionType',
      data: { values: EMPLOYEE_TRANSACTION_TYPES.join(', ') },
    })
  }

  return transactionType
}
