<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { EmployeeTransactionType, PaymentMethod } from '#shared/types/financial'
import { getExpectedPayroll } from '#shared/utils/payroll'
import { getExpectedTuition } from '#shared/utils/tuition'

const { t, locale } = useI18n()
const financeStore = useFinanceStore()
const { schools, termYear, operatorName, isSubmitting, error, submitMessage } = storeToRefs(financeStore)

const activeTab = ref<'student' | 'employee'>('student')

const studentSchoolId = ref('')
const studentId = ref('')
const studentAmount = ref<number | ''>('')
const paymentMethod = ref<PaymentMethod>('bankTransfer')
const studentDate = ref(todayIso())

const employeeSchoolId = ref('')
const employeeId = ref('')
const transactionType = ref<Extract<EmployeeTransactionType, 'salary' | 'bonus'>>('salary')
const employeeAmount = ref<number | ''>('')
const employeeDate = ref(todayIso())

const numberFormatter = computed(() =>
  new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US'),
)

const paymentMethods = computed(() => [
  { value: 'cash' as PaymentMethod, label: t('operator.paymentMethods.cash') },
  { value: 'card' as PaymentMethod, label: t('operator.paymentMethods.card') },
  { value: 'bankTransfer' as PaymentMethod, label: t('operator.paymentMethods.bankTransfer') },
  { value: 'cheque' as PaymentMethod, label: t('operator.paymentMethods.cheque') },
])

const transactionTypes = computed(() => [
  { value: 'salary' as const, label: t('operator.transactionTypes.salary') },
  { value: 'bonus' as const, label: t('operator.transactionTypes.bonus') },
])

const filteredStudents = computed(() =>
  studentSchoolId.value ? financeStore.studentsBySchool(studentSchoolId.value) : [],
)

const filteredEmployees = computed(() =>
  employeeSchoolId.value ? financeStore.employeesBySchool(employeeSchoolId.value) : [],
)

const selectedStudent = computed(() =>
  filteredStudents.value.find(student => student.id === studentId.value) ?? null,
)

const selectedEmployee = computed(() =>
  filteredEmployees.value.find(employee => employee.id === employeeId.value) ?? null,
)

const suggestedStudentAmount = computed(() => {
  if (!selectedStudent.value) {
    return null
  }

  return getExpectedTuition(selectedStudent.value)
})

const canSubmitStudent = computed(() =>
  Boolean(
    studentSchoolId.value
    && studentId.value
    && studentAmount.value !== ''
    && Number(studentAmount.value) > 0
    && paymentMethod.value
    && studentDate.value
    && operatorName.value.trim()
    && !isSubmitting.value,
  ),
)

const canSubmitEmployee = computed(() =>
  Boolean(
    employeeSchoolId.value
    && employeeId.value
    && employeeAmount.value !== ''
    && Number(employeeAmount.value) > 0
    && transactionType.value
    && employeeDate.value
    && operatorName.value.trim()
    && !isSubmitting.value,
  ),
)

watch(studentSchoolId, () => {
  studentId.value = ''
})

watch(studentId, () => {
  if (suggestedStudentAmount.value !== null && studentAmount.value === '') {
    studentAmount.value = suggestedStudentAmount.value
  }
})

watch(employeeSchoolId, () => {
  employeeId.value = ''
})

watch([employeeId, transactionType], () => {
  if (transactionType.value === 'salary' && selectedEmployee.value) {
    employeeAmount.value = getExpectedPayroll(selectedEmployee.value)
  }
})

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function onTermYearInput(event: Event) {
  financeStore.setTermYear((event.target as HTMLInputElement).value)
}

function onOperatorInput(event: Event) {
  financeStore.setOperatorName((event.target as HTMLInputElement).value)
}

async function submitStudent() {
  if (!canSubmitStudent.value) {
    return
  }

  financeStore.clearSubmitFeedback()

  try {
    await financeStore.logStudentPayment({
      schoolId: studentSchoolId.value,
      studentId: studentId.value,
      amountPaid: Number(studentAmount.value),
      paymentMethod: paymentMethod.value,
      date: studentDate.value,
    })
    studentAmount.value = ''
  }
  catch {
    // Error state handled by store
  }
}

async function submitEmployee() {
  if (!canSubmitEmployee.value) {
    return
  }

  financeStore.clearSubmitFeedback()

  try {
    await financeStore.logEmployeeExpense({
      schoolId: employeeSchoolId.value,
      employeeId: employeeId.value,
      amountPaid: Number(employeeAmount.value),
      transactionType: transactionType.value,
      date: employeeDate.value,
    })
    if (transactionType.value === 'bonus') {
      employeeAmount.value = ''
    }
  }
  catch {
    // Error state handled by store
  }
}
</script>

<template>
  <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <header class="mb-6">
      <h2 class="text-lg font-semibold text-gray-900">
        {{ $t('operator.title') }}
      </h2>
      <p class="mt-1 text-sm text-gray-500">
        {{ $t('operator.subtitle') }}
      </p>
    </header>

    <div class="mb-6 grid gap-4 sm:grid-cols-2">
      <label class="block space-y-1">
        <span class="text-sm font-medium text-gray-700">{{ $t('operator.fields.termYear') }}</span>
        <input
          :value="termYear"
          type="text"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          :placeholder="$t('operator.placeholders.termYear')"
          @input="onTermYearInput"
        >
      </label>
      <label class="block space-y-1">
        <span class="text-sm font-medium text-gray-700">{{ $t('operator.fields.operatorName') }}</span>
        <input
          :value="operatorName"
          type="text"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          :placeholder="$t('operator.placeholders.operatorName')"
          @input="onOperatorInput"
        >
      </label>
    </div>

    <div
      role="tablist"
      :aria-label="$t('operator.logType')"
      class="mb-6 inline-flex rounded-lg bg-gray-100 p-1"
    >
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'student'"
        class="rounded-md px-4 py-2 text-sm font-medium transition-colors"
        :class="activeTab === 'student' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'"
        @click="activeTab = 'student'"
      >
        {{ $t('operator.tabs.student') }}
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'employee'"
        class="rounded-md px-4 py-2 text-sm font-medium transition-colors"
        :class="activeTab === 'employee' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'"
        @click="activeTab = 'employee'"
      >
        {{ $t('operator.tabs.employee') }}
      </button>
    </div>

    <div
      v-if="submitMessage"
      class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
      role="status"
    >
      {{ submitMessage }}
    </div>
    <div
      v-if="error"
      class="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
      role="alert"
    >
      {{ error }}
    </div>

    <form
      v-show="activeTab === 'student'"
      role="tabpanel"
      class="space-y-4"
      @submit.prevent="submitStudent"
    >
      <label class="block space-y-1">
        <span class="text-sm font-medium text-gray-700">{{ $t('operator.fields.school') }}</span>
        <select
          v-model="studentSchoolId"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="" disabled>
            {{ $t('operator.placeholders.selectSchool') }}
          </option>
          <option v-for="school in schools" :key="school.id" :value="school.id">
            {{ school.name }} — {{ school.branch }}
          </option>
        </select>
      </label>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-gray-700">{{ $t('operator.fields.student') }}</span>
        <select
          v-model="studentId"
          required
          :disabled="!studentSchoolId"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="" disabled>
            {{ $t('operator.placeholders.selectStudent') }}
          </option>
          <option v-for="student in filteredStudents" :key="student.id" :value="student.id">
            {{ student.fullName }} — {{ student.studentId }}
          </option>
        </select>
      </label>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-gray-700">{{ $t('operator.fields.grade') }}</span>
        <input
          :value="selectedStudent?.grade ?? ''"
          type="text"
          disabled
          class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          :placeholder="$t('operator.placeholders.autoFilledStudent')"
        >
      </label>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-gray-700">{{ $t('operator.fields.amount') }}</span>
        <input
          v-model.number="studentAmount"
          type="number"
          min="1"
          step="1"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
        <p v-if="suggestedStudentAmount !== null" class="text-xs text-gray-500">
          {{ $t('operator.suggestedAmount', { amount: numberFormatter.format(suggestedStudentAmount) }) }}
        </p>
      </label>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-gray-700">{{ $t('operator.fields.paymentMethod') }}</span>
        <select
          v-model="paymentMethod"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option v-for="method in paymentMethods" :key="method.value" :value="method.value">
            {{ method.label }}
          </option>
        </select>
      </label>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-gray-700">{{ $t('operator.fields.date') }}</span>
        <input
          v-model="studentDate"
          type="date"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
      </label>

      <button
        type="submit"
        :disabled="!canSubmitStudent"
        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
      >
        {{ isSubmitting ? $t('common.saving') : $t('operator.submitStudent') }}
      </button>
    </form>

    <form
      v-show="activeTab === 'employee'"
      role="tabpanel"
      class="space-y-4"
      @submit.prevent="submitEmployee"
    >
      <label class="block space-y-1">
        <span class="text-sm font-medium text-gray-700">{{ $t('operator.fields.school') }}</span>
        <select
          v-model="employeeSchoolId"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="" disabled>
            {{ $t('operator.placeholders.selectSchool') }}
          </option>
          <option v-for="school in schools" :key="school.id" :value="school.id">
            {{ school.name }} — {{ school.branch }}
          </option>
        </select>
      </label>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-gray-700">{{ $t('operator.fields.staff') }}</span>
        <select
          v-model="employeeId"
          required
          :disabled="!employeeSchoolId"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="" disabled>
            {{ $t('operator.placeholders.selectStaff') }}
          </option>
          <option v-for="employee in filteredEmployees" :key="employee.id" :value="employee.id">
            {{ employee.fullName }} — {{ employee.employeeId }}
          </option>
        </select>
      </label>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-gray-700">{{ $t('operator.fields.role') }}</span>
        <input
          :value="selectedEmployee?.role ?? ''"
          type="text"
          disabled
          class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          :placeholder="$t('operator.placeholders.autoFilledStaff')"
        >
      </label>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-gray-700">{{ $t('operator.fields.type') }}</span>
        <select
          v-model="transactionType"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option v-for="type in transactionTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
      </label>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-gray-700">{{ $t('operator.fields.amount') }}</span>
        <input
          v-model.number="employeeAmount"
          type="number"
          min="1"
          step="1"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
      </label>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-gray-700">{{ $t('operator.fields.date') }}</span>
        <input
          v-model="employeeDate"
          type="date"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
      </label>

      <button
        type="submit"
        :disabled="!canSubmitEmployee"
        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
      >
        {{ isSubmitting ? $t('common.saving') : $t('operator.submitEmployee') }}
      </button>
    </form>
  </section>
</template>
