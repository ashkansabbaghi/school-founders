export type PaymentMethod = 'cash' | 'card' | 'bankTransfer' | 'cheque'
export type EmployeeTransactionType = 'salary' | 'bonus' | 'deduction'

export interface School {
  id: string
  name: string
  branch: string
}

export interface Student {
  id: string
  schoolId: string
  fullName: string
  nationalCode: string
  studentId: string
  grade: string
  fullPrice: number
  dynamicDiscountRate: number
  parentName: string
  parentPhone: string
}

export type StudentPaymentStatus = 'paid' | 'partial' | 'unpaid'

export interface StudentPaymentSummary {
  expected: number
  paid: number
  remaining: number
  status: StudentPaymentStatus
}

export type EmployeeExpenseStatus = 'paid' | 'partial' | 'unpaid'

export interface EmployeeExpenseSummary {
  expected: number
  paid: number
  remaining: number
  status: EmployeeExpenseStatus
}

export interface Employee {
  id: string
  schoolId: string
  fullName: string
  nationalCode: string
  employeeId: string
  role: string
  baseSalary: number
  insuranceCost: number
}

export interface StudentTransaction {
  id: string
  studentId: string
  schoolId: string
  amountPaid: number
  paymentMethod: PaymentMethod
  date: string
  termYear: string
  operator: string
  loggedAt?: string
}

export interface EmployeeTransaction {
  id: string
  employeeId: string
  schoolId: string
  amountPaid: number
  transactionType: EmployeeTransactionType
  date: string
  termYear: string
  operator: string
  loggedAt?: string
}

export type RecentLogKind = 'student' | 'employee'

export interface RecentLogEntry {
  id: string
  kind: RecentLogKind
  date: string
  termYear: string
  operator: string
  amountPaid: number
  schoolId: string
  schoolName: string
  schoolBranch: string
  personName: string
  detail: string
  loggedAt: string
}

export interface FixedCost {
  id: string
  schoolId: string
  label: string
  amount: number
  termYear: string
}

export interface SchoolProfitBreakdown {
  schoolId: string
  schoolName: string
  branch: string
  revenue: number
  employeeExpenses: number
  fixedCosts: number
  operationalExpenses: number
  grossProfit: number
  tax: number
  reserveFund: number
  netProfit: number
}

export interface FinanceSummary {
  totalRevenue: number
  totalOperationalExpenses: number
  totalGrossProfit: number
  totalTax: number
  totalReserveFund: number
  totalNetProfit: number
  schools: SchoolProfitBreakdown[]
}

export interface StudentLogPayload {
  studentId: string
  schoolId: string
  amountPaid: number
  paymentMethod: PaymentMethod
  date: string
  termYear: string
  operator: string
}

export interface EmployeeLogPayload {
  employeeId: string
  schoolId: string
  amountPaid: number
  transactionType: EmployeeTransactionType
  date: string
  termYear: string
  operator: string
}
