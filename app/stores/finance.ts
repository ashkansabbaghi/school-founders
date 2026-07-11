import { defineStore } from 'pinia'
import type {
  Employee,
  EmployeeExpenseSummary,
  EmployeeLogPayload,
  EmployeeTransaction,
  FinanceSummary,
  School,
  Student,
  StudentLogPayload,
  StudentPaymentSummary,
  StudentTransaction,
} from '#shared/types/financial'
import { getEmployeeExpenseSummary } from '#shared/utils/payroll'
import { getStudentPaymentSummary } from '#shared/utils/tuition'
import {
  loadProfileSettings,
  saveOperatorName as persistOperatorName,
  saveTermYear as persistTermYear,
} from '~/db/bootstrap'
import {
  calculateFinanceSummary,
  deleteEmployeeTransaction as deleteEmployeeTransactionRecord,
  deleteStudentTransaction as deleteStudentTransactionRecord,
  fetchMasterData as fetchMasterDataFromDb,
  listEmployeeTransactions,
  listStudentTransactions,
  logEmployeeExpense as logEmployeeExpenseRecord,
  logStudentPayment as logStudentPaymentRecord,
  removeEmployee as removeEmployeeRecord,
  removeStudent as removeStudentRecord,
  saveEmployee as saveEmployeeRecord,
  saveStudent as saveStudentRecord,
  updateEmployeeTransaction as updateEmployeeTransactionRecord,
  updateStudentTransaction as updateStudentTransactionRecord,
} from '~/services/finance'
import { translateApiError } from '~/utils/translateApiError'

type FetchStatus = 'idle' | 'loading' | 'error'
type SubmitStatus = 'idle' | 'submitting' | 'error'

function getTranslator() {
  const nuxtApp = useNuxtApp()
  return nuxtApp.$i18n.t.bind(nuxtApp.$i18n)
}

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    termYear: '1404-1405',
    operatorName: '',
    schools: [] as School[],
    students: [] as Student[],
    employees: [] as Employee[],
    summary: null as FinanceSummary | null,
    status: 'idle' as FetchStatus,
    submitStatus: 'idle' as SubmitStatus,
    error: null as string | null,
    submitMessage: null as string | null,
  }),

  getters: {
    isLoading: state => state.status === 'loading',
    isSubmitting: state => state.submitStatus === 'submitting',

    studentsBySchool: state => (schoolId: string) =>
      state.students.filter(student => student.schoolId === schoolId),

    employeesBySchool: state => (schoolId: string) =>
      state.employees.filter(employee => employee.schoolId === schoolId),

    studentPaymentSummary: () =>
      (student: Student, transactions: StudentTransaction[]): StudentPaymentSummary =>
        getStudentPaymentSummary(student, transactions),

    employeeExpenseSummary: () =>
      (employee: Employee, transactions: EmployeeTransaction[]): EmployeeExpenseSummary =>
        getEmployeeExpenseSummary(employee, transactions),
  },

  actions: {
    async init() {
      this.status = 'loading'
      this.error = null

      try {
        if (import.meta.client) {
          const profile = await loadProfileSettings()
          this.operatorName = profile.operatorName
          this.termYear = profile.termYear
        }

        await Promise.all([this.fetchMasterData(), this.fetchSummary()])
        this.status = 'idle'
      }
      catch (error) {
        this.status = 'error'
        this.error = translateApiError(error, getTranslator())
      }
    },

    setTermYear(termYear: string) {
      this.termYear = termYear
      if (import.meta.client) {
        void persistTermYear(termYear)
      }
      void this.fetchSummary()
    },

    setOperatorName(name: string) {
      this.operatorName = name
      if (import.meta.client) {
        void persistOperatorName(name)
      }
    },

    async fetchSummary() {
      this.summary = await calculateFinanceSummary({ termYear: this.termYear })
    },

    async fetchMasterData() {
      const { schools, students, employees } = await fetchMasterDataFromDb()
      this.schools = schools
      this.students = students
      this.employees = employees
    },

    async logStudentPayment(
      payload: Omit<StudentLogPayload, 'termYear' | 'operator'>,
    ) {
      this.submitStatus = 'submitting'
      this.error = null
      this.submitMessage = null

      try {
        await logStudentPaymentRecord({
          ...payload,
          termYear: this.termYear,
          operator: this.operatorName,
        })

        await this.fetchSummary()
        this.submitStatus = 'idle'
        this.submitMessage = getTranslator()('messages.studentLogged')
      }
      catch (error) {
        this.submitStatus = 'error'
        this.error = translateApiError(error, getTranslator())
        throw error
      }
    },

    async logEmployeeExpense(payload: Omit<EmployeeLogPayload, 'termYear' | 'operator'>) {
      this.submitStatus = 'submitting'
      this.error = null
      this.submitMessage = null

      try {
        await logEmployeeExpenseRecord({
          ...payload,
          termYear: this.termYear,
          operator: this.operatorName,
        })

        await this.fetchSummary()
        this.submitStatus = 'idle'
        this.submitMessage = getTranslator()('messages.employeeLogged')
      }
      catch (error) {
        this.submitStatus = 'error'
        this.error = translateApiError(error, getTranslator())
        throw error
      }
    },

    clearSubmitFeedback() {
      this.error = null
      this.submitMessage = null
      this.submitStatus = 'idle'
    },

    async saveStudent(payload: Omit<Student, 'id'> & { id?: string }) {
      this.submitStatus = 'submitting'
      this.error = null
      this.submitMessage = null

      try {
        const student = await saveStudentRecord(payload)

        await this.fetchMasterData()
        this.submitStatus = 'idle'
        this.submitMessage = getTranslator()('messages.studentSaved')
        return student
      }
      catch (error) {
        this.submitStatus = 'error'
        this.error = translateApiError(error, getTranslator())
        throw error
      }
    },

    async removeStudent(id: string) {
      this.submitStatus = 'submitting'
      this.error = null
      this.submitMessage = null

      try {
        await removeStudentRecord(id)

        await Promise.all([this.fetchMasterData(), this.fetchSummary()])
        this.submitStatus = 'idle'
        this.submitMessage = getTranslator()('messages.studentRemoved')
      }
      catch (error) {
        this.submitStatus = 'error'
        this.error = translateApiError(error, getTranslator())
        throw error
      }
    },

    async fetchStudentTransactions(studentId: string) {
      return listStudentTransactions({
        studentId,
        termYear: this.termYear,
      })
    },

    async fetchStudentTransactionsForTerm() {
      return listStudentTransactions({ termYear: this.termYear })
    },

    async updateStudentTransaction(
      id: string,
      payload: Omit<StudentLogPayload, 'termYear' | 'operator'>,
    ) {
      this.submitStatus = 'submitting'
      this.error = null
      this.submitMessage = null

      try {
        await updateStudentTransactionRecord(id, {
          ...payload,
          termYear: this.termYear,
          operator: this.operatorName,
        })

        await this.fetchSummary()
        this.submitStatus = 'idle'
        this.submitMessage = getTranslator()('messages.studentPaymentUpdated')
      }
      catch (error) {
        this.submitStatus = 'error'
        this.error = translateApiError(error, getTranslator())
        throw error
      }
    },

    async deleteStudentTransaction(id: string) {
      this.submitStatus = 'submitting'
      this.error = null
      this.submitMessage = null

      try {
        await deleteStudentTransactionRecord(id)

        await this.fetchSummary()
        this.submitStatus = 'idle'
        this.submitMessage = getTranslator()('messages.studentPaymentRemoved')
      }
      catch (error) {
        this.submitStatus = 'error'
        this.error = translateApiError(error, getTranslator())
        throw error
      }
    },

    async saveEmployee(payload: Omit<Employee, 'id'> & { id?: string }) {
      this.submitStatus = 'submitting'
      this.error = null
      this.submitMessage = null

      try {
        const employee = await saveEmployeeRecord(payload)

        await this.fetchMasterData()
        this.submitStatus = 'idle'
        this.submitMessage = getTranslator()('messages.employeeSaved')
        return employee
      }
      catch (error) {
        this.submitStatus = 'error'
        this.error = translateApiError(error, getTranslator())
        throw error
      }
    },

    async removeEmployee(id: string) {
      this.submitStatus = 'submitting'
      this.error = null
      this.submitMessage = null

      try {
        await removeEmployeeRecord(id)

        await Promise.all([this.fetchMasterData(), this.fetchSummary()])
        this.submitStatus = 'idle'
        this.submitMessage = getTranslator()('messages.employeeRemoved')
      }
      catch (error) {
        this.submitStatus = 'error'
        this.error = translateApiError(error, getTranslator())
        throw error
      }
    },

    async fetchEmployeeTransactions(employeeId: string) {
      return listEmployeeTransactions({
        employeeId,
        termYear: this.termYear,
      })
    },

    async fetchEmployeeTransactionsForTerm() {
      return listEmployeeTransactions({ termYear: this.termYear })
    },

    async updateEmployeeTransaction(
      id: string,
      payload: Omit<EmployeeLogPayload, 'termYear' | 'operator'>,
    ) {
      this.submitStatus = 'submitting'
      this.error = null
      this.submitMessage = null

      try {
        await updateEmployeeTransactionRecord(id, {
          ...payload,
          termYear: this.termYear,
          operator: this.operatorName,
        })

        await this.fetchSummary()
        this.submitStatus = 'idle'
        this.submitMessage = getTranslator()('messages.employeeExpenseUpdated')
      }
      catch (error) {
        this.submitStatus = 'error'
        this.error = translateApiError(error, getTranslator())
        throw error
      }
    },

    async deleteEmployeeTransaction(id: string) {
      this.submitStatus = 'submitting'
      this.error = null
      this.submitMessage = null

      try {
        await deleteEmployeeTransactionRecord(id)

        await this.fetchSummary()
        this.submitStatus = 'idle'
        this.submitMessage = getTranslator()('messages.employeeExpenseRemoved')
      }
      catch (error) {
        this.submitStatus = 'error'
        this.error = translateApiError(error, getTranslator())
        throw error
      }
    },
  },
})
