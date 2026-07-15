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
  saveUserName as persistUserName,
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
import type { AppToastKind } from '~/composables/useAppToast'

type FetchStatus = 'idle' | 'loading' | 'error'
type SubmitStatus = 'idle' | 'submitting' | 'error'

function getTranslator() {
  const nuxtApp = useNuxtApp()
  return nuxtApp.$i18n.t.bind(nuxtApp.$i18n)
}

function notifyFeedback(kind: AppToastKind, message: string) {
  useAppToast().show(kind, message)
}

const SUMMARY_DEBOUNCE_MS = 300

let initPromise: Promise<void> | null = null
let summaryFetchTimer: ReturnType<typeof setTimeout> | null = null

function cancelDebouncedSummaryFetch() {
  if (summaryFetchTimer) {
    clearTimeout(summaryFetchTimer)
    summaryFetchTimer = null
  }
}

function scheduleDebouncedSummaryFetch(fetchSummary: () => Promise<void>) {
  cancelDebouncedSummaryFetch()
  summaryFetchTimer = setTimeout(() => {
    summaryFetchTimer = null
    void fetchSummary()
  }, SUMMARY_DEBOUNCE_MS)
}

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    termYear: '1404-1405',
    userName: '',
    schools: [] as School[],
    students: [] as Student[],
    employees: [] as Employee[],
    summary: null as FinanceSummary | null,
    status: 'idle' as FetchStatus,
    submitStatus: 'idle' as SubmitStatus,
    error: null as string | null,
    profileHydrated: false,
    initialized: false,
    onboardingComplete: null as boolean | null,
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
    async hydrateProfile() {
      if (this.profileHydrated || !import.meta.client) {
        return
      }

      const profile = await loadProfileSettings()
      this.userName = profile.userName
      this.termYear = profile.termYear
      this.profileHydrated = true
    },

    async ensureReady() {
      if (this.onboardingComplete === false) {
        return
      }

      if (this.initialized) {
        return
      }

      if (!initPromise) {
        initPromise = this.performInit()
      }

      await initPromise
    },

    setOnboardingComplete(complete: boolean) {
      this.onboardingComplete = complete
    },

    async init() {
      return this.ensureReady()
    },

    async reload() {
      cancelDebouncedSummaryFetch()
      this.initialized = false
      initPromise = null
      return this.ensureReady()
    },

    async performInit() {
      this.status = 'loading'
      this.error = null

      try {
        await this.hydrateProfile()

        await Promise.all([this.fetchMasterData(), this.fetchSummary()])
        this.status = 'idle'
        this.initialized = true
      }
      catch (error) {
        const message = translateApiError(error, getTranslator())
        this.status = 'error'
        this.error = message
        notifyFeedback('error', message)
        initPromise = null
        throw error
      }
    },

    setTermYear(termYear: string, options?: { immediate?: boolean }) {
      this.termYear = termYear
      if (import.meta.client) {
        void persistTermYear(termYear)
      }

      if (options?.immediate) {
        cancelDebouncedSummaryFetch()
        void this.fetchSummary()
        return
      }

      scheduleDebouncedSummaryFetch(() => this.fetchSummary())
    },

    setUserName(name: string) {
      this.userName = name
      if (import.meta.client) {
        void persistUserName(name)
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

      try {
        await logStudentPaymentRecord({
          ...payload,
          termYear: this.termYear,
          operator: this.userName,
        })

        await this.fetchSummary()
        this.submitStatus = 'idle'
        notifyFeedback('success', getTranslator()('messages.studentLogged'))
      }
      catch (error) {
        this.submitStatus = 'error'
        notifyFeedback('error', translateApiError(error, getTranslator()))
        throw error
      }
    },

    async logEmployeeExpense(payload: Omit<EmployeeLogPayload, 'termYear' | 'operator'>) {
      this.submitStatus = 'submitting'

      try {
        await logEmployeeExpenseRecord({
          ...payload,
          termYear: this.termYear,
          operator: this.userName,
        })

        await this.fetchSummary()
        this.submitStatus = 'idle'
        notifyFeedback('success', getTranslator()('messages.employeeLogged'))
      }
      catch (error) {
        this.submitStatus = 'error'
        notifyFeedback('error', translateApiError(error, getTranslator()))
        throw error
      }
    },

    clearSubmitFeedback() {
      this.submitStatus = 'idle'
    },

    async saveStudent(payload: Omit<Student, 'id'> & { id?: string }) {
      this.submitStatus = 'submitting'

      try {
        const student = await saveStudentRecord(payload)

        await this.fetchMasterData()
        this.submitStatus = 'idle'
        notifyFeedback('success', getTranslator()('messages.studentSaved'))
        return student
      }
      catch (error) {
        this.submitStatus = 'error'
        notifyFeedback('error', translateApiError(error, getTranslator()))
        throw error
      }
    },

    async removeStudent(id: string) {
      this.submitStatus = 'submitting'

      try {
        await removeStudentRecord(id)

        await Promise.all([this.fetchMasterData(), this.fetchSummary()])
        this.submitStatus = 'idle'
        notifyFeedback('success', getTranslator()('messages.studentRemoved'))
      }
      catch (error) {
        this.submitStatus = 'error'
        notifyFeedback('error', translateApiError(error, getTranslator()))
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

      try {
        await updateStudentTransactionRecord(id, {
          ...payload,
          termYear: this.termYear,
          operator: this.userName,
        })

        await this.fetchSummary()
        this.submitStatus = 'idle'
        notifyFeedback('success', getTranslator()('messages.studentPaymentUpdated'))
      }
      catch (error) {
        this.submitStatus = 'error'
        notifyFeedback('error', translateApiError(error, getTranslator()))
        throw error
      }
    },

    async deleteStudentTransaction(id: string) {
      this.submitStatus = 'submitting'

      try {
        await deleteStudentTransactionRecord(id)

        await this.fetchSummary()
        this.submitStatus = 'idle'
        notifyFeedback('success', getTranslator()('messages.studentPaymentRemoved'))
      }
      catch (error) {
        this.submitStatus = 'error'
        notifyFeedback('error', translateApiError(error, getTranslator()))
        throw error
      }
    },

    async saveEmployee(payload: Omit<Employee, 'id'> & { id?: string }) {
      this.submitStatus = 'submitting'

      try {
        const employee = await saveEmployeeRecord(payload)

        await this.fetchMasterData()
        this.submitStatus = 'idle'
        notifyFeedback('success', getTranslator()('messages.employeeSaved'))
        return employee
      }
      catch (error) {
        this.submitStatus = 'error'
        notifyFeedback('error', translateApiError(error, getTranslator()))
        throw error
      }
    },

    async removeEmployee(id: string) {
      this.submitStatus = 'submitting'

      try {
        await removeEmployeeRecord(id)

        await Promise.all([this.fetchMasterData(), this.fetchSummary()])
        this.submitStatus = 'idle'
        notifyFeedback('success', getTranslator()('messages.employeeRemoved'))
      }
      catch (error) {
        this.submitStatus = 'error'
        notifyFeedback('error', translateApiError(error, getTranslator()))
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

      try {
        await updateEmployeeTransactionRecord(id, {
          ...payload,
          termYear: this.termYear,
          operator: this.userName,
        })

        await this.fetchSummary()
        this.submitStatus = 'idle'
        notifyFeedback('success', getTranslator()('messages.employeeExpenseUpdated'))
      }
      catch (error) {
        this.submitStatus = 'error'
        notifyFeedback('error', translateApiError(error, getTranslator()))
        throw error
      }
    },

    async deleteEmployeeTransaction(id: string) {
      this.submitStatus = 'submitting'

      try {
        await deleteEmployeeTransactionRecord(id)

        await this.fetchSummary()
        this.submitStatus = 'idle'
        notifyFeedback('success', getTranslator()('messages.employeeExpenseRemoved'))
      }
      catch (error) {
        this.submitStatus = 'error'
        notifyFeedback('error', translateApiError(error, getTranslator()))
        throw error
      }
    },
  },
})
