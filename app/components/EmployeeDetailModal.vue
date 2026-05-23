<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Employee, EmployeeTransaction, EmployeeTransactionType } from '#shared/types/financial'
import { getExpectedPayroll } from '#shared/utils/payroll'

const props = defineProps<{
  employee: Employee
}>()

const emit = defineEmits<{
  close: []
  updated: [employee: Employee]
  removed: []
  changed: []
}>()

const { t, locale } = useI18n()
const financeStore = useFinanceStore()
const { schools, termYear, operatorName, isSubmitting, error, submitMessage } = storeToRefs(financeStore)

const transactions = ref<EmployeeTransaction[]>([])
const isLoadingTransactions = ref(true)
const editingTransactionId = ref<string | null>(null)

const form = reactive({
  fullName: '',
  nationalCode: '',
  employeeId: '',
  role: '',
  schoolId: '',
  baseSalary: '' as number | '',
  insuranceCost: '' as number | '',
})

const expenseAmount = ref<number | ''>('')
const transactionType = ref<EmployeeTransactionType>('salary')
const expenseDate = ref('')
const expenseError = ref<string | null>(null)

const numberFormatter = computed(() =>
  new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US'),
)

const transactionTypes = computed(() => [
  { value: 'salary' as EmployeeTransactionType, label: t('operator.transactionTypes.salary') },
  { value: 'bonus' as EmployeeTransactionType, label: t('operator.transactionTypes.bonus') },
  { value: 'deduction' as EmployeeTransactionType, label: t('operator.transactionTypes.deduction') },
])

const expenseSummary = computed(() =>
  financeStore.employeeExpenseSummary(props.employee, transactions.value),
)

const progressPercent = computed(() => {
  if (expenseSummary.value.expected <= 0) {
    return 0
  }

  return Math.min(100, (expenseSummary.value.paid / expenseSummary.value.expected) * 100)
})

const statusClasses = computed(() => {
  switch (expenseSummary.value.status) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-800'
    case 'partial':
      return 'bg-amber-100 text-amber-800'
    default:
      return 'bg-rose-100 text-rose-800'
  }
})

const canSaveEmployee = computed(() =>
  Boolean(
    form.fullName.trim()
    && form.nationalCode.trim()
    && form.employeeId.trim()
    && form.role.trim()
    && form.schoolId
    && form.baseSalary !== ''
    && Number(form.baseSalary) > 0
    && form.insuranceCost !== ''
    && Number(form.insuranceCost) >= 0
    && !isSubmitting.value,
  ),
)

const canSubmitExpense = computed(() =>
  Boolean(
    expenseAmount.value !== ''
    && Number(expenseAmount.value) > 0
    && transactionType.value
    && expenseDate.value
    && operatorName.value.trim()
    && !isSubmitting.value,
  ),
)

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function resetFormFromEmployee(employee: Employee) {
  form.fullName = employee.fullName
  form.nationalCode = employee.nationalCode
  form.employeeId = employee.employeeId
  form.role = employee.role
  form.schoolId = employee.schoolId
  form.baseSalary = employee.baseSalary
  form.insuranceCost = employee.insuranceCost
}

function resetExpenseForm() {
  editingTransactionId.value = null
  expenseAmount.value = ''
  transactionType.value = 'salary'
  expenseDate.value = todayIso()
  expenseError.value = null
}

async function loadTransactions() {
  isLoadingTransactions.value = true

  try {
    transactions.value = await financeStore.fetchEmployeeTransactions(props.employee.id)
    emit('changed')
  }
  finally {
    isLoadingTransactions.value = false
  }
}

async function saveEmployeeViaStore() {
  if (!canSaveEmployee.value) {
    return
  }

  financeStore.clearSubmitFeedback()

  try {
    const updated = await financeStore.saveEmployee({
      id: props.employee.id,
      fullName: form.fullName.trim(),
      nationalCode: form.nationalCode.trim(),
      employeeId: form.employeeId.trim(),
      role: form.role.trim(),
      schoolId: form.schoolId,
      baseSalary: Number(form.baseSalary),
      insuranceCost: Number(form.insuranceCost),
    })

    if (updated) {
      emit('updated', updated)
    }
  }
  catch {
    // Error handled by store
  }
}

async function removeEmployee() {
  if (!confirm(t('employees.confirmDelete'))) {
    return
  }

  financeStore.clearSubmitFeedback()

  try {
    await financeStore.removeEmployee(props.employee.id)
    emit('removed')
  }
  catch {
    // Error handled by store
  }
}

function startEditExpense(transaction: EmployeeTransaction) {
  editingTransactionId.value = transaction.id
  expenseAmount.value = transaction.amountPaid
  transactionType.value = transaction.transactionType
  expenseDate.value = transaction.date
  expenseError.value = null
}

async function submitExpense() {
  if (!canSubmitExpense.value) {
    return
  }

  expenseError.value = null
  financeStore.clearSubmitFeedback()

  const payload = {
    employeeId: props.employee.id,
    schoolId: props.employee.schoolId,
    amountPaid: Number(expenseAmount.value),
    transactionType: transactionType.value,
    date: expenseDate.value,
  }

  try {
    if (editingTransactionId.value) {
      await financeStore.updateEmployeeTransaction(editingTransactionId.value, payload)
    }
    else {
      await financeStore.logEmployeeExpense(payload)
    }

    resetExpenseForm()
    await loadTransactions()
  }
  catch {
    expenseError.value = financeStore.error
  }
}

async function deleteExpense(transaction: EmployeeTransaction) {
  if (!confirm(t('employees.confirmDeleteExpense'))) {
    return
  }

  financeStore.clearSubmitFeedback()

  try {
    await financeStore.deleteEmployeeTransaction(transaction.id)

    if (editingTransactionId.value === transaction.id) {
      resetExpenseForm()
    }

    await loadTransactions()
  }
  catch {
    // Error handled by store
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

watch(
  () => props.employee,
  (employee) => {
    resetFormFromEmployee(employee)
  },
  { immediate: true },
)

watch([transactionType, () => props.employee], () => {
  if (transactionType.value === 'salary' && !editingTransactionId.value) {
    expenseAmount.value = getExpectedPayroll(props.employee)
  }
})

onMounted(() => {
  expenseDate.value = todayIso()
  void loadTransactions()
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
    @click.self="emit('close')"
  >
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="$t('employees.modalTitle', { name: employee.fullName })"
      class="my-8 w-full max-w-3xl rounded-xl border border-gray-200 bg-white shadow-xl"
    >
      <header class="flex items-start justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">
            {{ employee.fullName }}
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            {{ employee.employeeId }} — {{ $t('employees.termYear', { termYear }) }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          :aria-label="$t('employees.close')"
          @click="emit('close')"
        >
          ✕
        </button>
      </header>

      <div class="max-h-[calc(100vh-8rem)] overflow-y-auto px-6 py-5">
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

        <section class="mb-8">
          <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {{ $t('employees.expenseSummary') }}
          </h3>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="mb-3 flex flex-wrap items-center gap-3">
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                :class="statusClasses"
              >
                {{ $t(`employees.status.${expenseSummary.status}`) }}
              </span>
              <span class="text-sm text-gray-600">
                {{ $t('employees.paidOfExpected', {
                  paid: numberFormatter.format(expenseSummary.paid),
                  expected: numberFormatter.format(expenseSummary.expected),
                }) }}
              </span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                class="h-full rounded-full bg-indigo-600 transition-all"
                :style="{ width: `${progressPercent}%` }"
              />
            </div>
            <p class="mt-2 text-sm text-gray-600">
              {{ $t('employees.remaining', { amount: numberFormatter.format(expenseSummary.remaining) }) }}
            </p>
          </div>
        </section>

        <section class="mb-8">
          <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {{ $t('employees.employeeInfo') }}
          </h3>
          <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="saveEmployeeViaStore">
            <label class="block space-y-1 sm:col-span-2">
              <span class="text-sm font-medium text-gray-700">{{ $t('employees.fields.fullName') }}</span>
              <input
                v-model="form.fullName"
                type="text"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">{{ $t('employees.fields.nationalCode') }}</span>
              <input
                v-model="form.nationalCode"
                type="text"
                required
                maxlength="10"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">{{ $t('employees.fields.employeeId') }}</span>
              <input
                v-model="form.employeeId"
                type="text"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">{{ $t('employees.fields.role') }}</span>
              <input
                v-model="form.role"
                type="text"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">{{ $t('employees.fields.school') }}</span>
              <select
                v-model="form.schoolId"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option v-for="school in schools" :key="school.id" :value="school.id">
                  {{ school.name }} — {{ school.branch }}
                </option>
              </select>
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">{{ $t('employees.fields.baseSalary') }}</span>
              <input
                v-model.number="form.baseSalary"
                type="number"
                min="1"
                step="1"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">{{ $t('employees.fields.insuranceCost') }}</span>
              <input
                v-model.number="form.insuranceCost"
                type="number"
                min="0"
                step="1"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
            </label>
            <div class="flex flex-wrap gap-3 sm:col-span-2">
              <button
                type="submit"
                :disabled="!canSaveEmployee"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {{ isSubmitting ? $t('common.saving') : $t('employees.saveEmployee') }}
              </button>
              <button
                type="button"
                class="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                @click="removeEmployee"
              >
                {{ $t('employees.deleteEmployee') }}
              </button>
            </div>
          </form>
        </section>

        <section>
          <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {{ $t('employees.expenses') }}
          </h3>

          <div v-if="isLoadingTransactions" class="py-4 text-sm text-gray-500">
            {{ $t('common.loading') }}
          </div>
          <div
            v-else-if="transactions.length === 0"
            class="mb-4 rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500"
          >
            {{ $t('employees.noExpenses') }}
          </div>
          <div v-else class="mb-6 overflow-x-auto rounded-lg border border-gray-200">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-start font-medium text-gray-600">
                    {{ $t('employees.columns.date') }}
                  </th>
                  <th class="px-4 py-2 text-start font-medium text-gray-600">
                    {{ $t('employees.columns.amount') }}
                  </th>
                  <th class="px-4 py-2 text-start font-medium text-gray-600">
                    {{ $t('employees.columns.type') }}
                  </th>
                  <th class="px-4 py-2 text-start font-medium text-gray-600">
                    {{ $t('employees.columns.operator') }}
                  </th>
                  <th class="px-4 py-2 text-end font-medium text-gray-600">
                    {{ $t('employees.columns.actions') }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="transaction in transactions" :key="transaction.id">
                  <td class="px-4 py-2 text-gray-900">
                    {{ transaction.date }}
                  </td>
                  <td class="px-4 py-2 text-gray-900">
                    {{ numberFormatter.format(transaction.amountPaid) }}
                  </td>
                  <td class="px-4 py-2 text-gray-600">
                    {{ $t(`operator.transactionTypes.${transaction.transactionType}`) }}
                  </td>
                  <td class="px-4 py-2 text-gray-600">
                    {{ transaction.operator }}
                  </td>
                  <td class="px-4 py-2 text-end">
                    <button
                      type="button"
                      class="me-2 text-indigo-600 hover:text-indigo-800"
                      @click="startEditExpense(transaction)"
                    >
                      {{ $t('employees.editExpense') }}
                    </button>
                    <button
                      type="button"
                      class="text-rose-600 hover:text-rose-800"
                      @click="deleteExpense(transaction)"
                    >
                      {{ $t('common.delete') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <form class="grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2" @submit.prevent="submitExpense">
            <p class="text-sm font-medium text-gray-700 sm:col-span-2">
              {{ editingTransactionId ? $t('employees.editExpenseForm') : $t('employees.addExpense') }}
            </p>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">{{ $t('employees.fields.amount') }}</span>
              <input
                v-model.number="expenseAmount"
                type="number"
                min="1"
                step="1"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">{{ $t('employees.fields.type') }}</span>
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
              <span class="text-sm font-medium text-gray-700">{{ $t('employees.fields.date') }}</span>
              <input
                v-model="expenseDate"
                type="date"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">{{ $t('operator.fields.operatorName') }}</span>
              <input
                :value="operatorName"
                type="text"
                disabled
                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500"
              >
            </label>
            <div class="flex flex-wrap gap-3 sm:col-span-2">
              <button
                type="submit"
                :disabled="!canSubmitExpense"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {{ isSubmitting ? $t('common.saving') : (editingTransactionId ? $t('employees.updateExpense') : $t('employees.addExpenseButton')) }}
              </button>
              <button
                v-if="editingTransactionId"
                type="button"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
                @click="resetExpenseForm"
              >
                {{ $t('employees.cancelEdit') }}
              </button>
            </div>
            <p
              v-if="expenseError"
              class="text-sm text-rose-600 sm:col-span-2"
              role="alert"
            >
              {{ expenseError }}
            </p>
          </form>
        </section>
      </div>
    </div>
  </div>
</template>
