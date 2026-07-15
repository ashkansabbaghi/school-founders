<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Employee, EmployeeTransaction, EmployeeTransactionType } from '#shared/types/financial'
import { getExpectedPayroll } from '#shared/utils/payroll'
import { formatIsoDateDisplay, todayIso } from '#shared/utils/jalaliDate'

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
const { schools, termYear, isSubmitting, error, submitMessage } = storeToRefs(financeStore)

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
      return 'ui-badge-paid'
    case 'partial':
      return 'ui-badge-warning'
    default:
      return 'ui-badge-danger'
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
    && !isSubmitting.value,
  ),
)

function formatTransactionDate(date: string): string {
  return formatIsoDateDisplay(date)
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
    class="ui-modal-overlay"
    @click.self="emit('close')"
  >
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="$t('employees.modalTitle', { name: employee.fullName })"
      class="ui-modal-panel max-w-3xl sm:my-8"
    >
      <header class="ui-modal-header">
        <div class="min-w-0">
          <h2 class="text-lg font-semibold">
            {{ employee.fullName }}
          </h2>
          <p class="mt-1 text-sm ui-text-muted">
            {{ employee.employeeId }} — {{ $t('employees.termYear', { termYear }) }}
          </p>
        </div>
        <button
          type="button"
          class="ui-modal-close"
          :aria-label="$t('employees.close')"
          @click="emit('close')"
        >
          ✕
        </button>
      </header>

      <div class="scrollbar-thin px-4 py-5 sm:max-h-[calc(100vh-8rem)] sm:overflow-y-auto sm:px-6">
        <div
          v-if="submitMessage"
          class="ui-alert-success mb-4"
          role="status"
        >
          {{ submitMessage }}
        </div>
        <div
          v-if="error"
          class="ui-alert-error mb-4"
          role="alert"
        >
          {{ error }}
        </div>

        <section class="mb-8">
          <h3 class="ui-section-header mb-4">
            {{ $t('employees.expenseSummary') }}
          </h3>
          <div class="ui-inset-panel">
            <div class="mb-3 flex flex-wrap items-center gap-3">
              <span :class="statusClasses">
                {{ $t(`employees.status.${expenseSummary.status}`) }}
              </span>
              <span class="text-sm ui-text-muted">
                {{ $t('employees.paidOfExpected', {
                  paid: numberFormatter.format(expenseSummary.paid),
                  expected: numberFormatter.format(expenseSummary.expected),
                }) }}
              </span>
            </div>
            <div class="h-2 ui-progress-track">
              <div
                class="h-full rounded-full bg-violet-600 shadow-glow transition-all"
                :style="{ width: `${progressPercent}%` }"
              />
            </div>
            <p class="mt-2 text-sm ui-text-muted">
              {{ $t('employees.remaining', { amount: numberFormatter.format(expenseSummary.remaining) }) }}
            </p>
          </div>
        </section>

        <section class="mb-8">
          <h3 class="ui-section-header mb-4">
            {{ $t('employees.employeeInfo') }}
          </h3>
          <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="saveEmployeeViaStore">
            <label class="block space-y-1 sm:col-span-2">
              <span class="ui-label">{{ $t('employees.fields.fullName') }}</span>
              <input
                v-model="form.fullName"
                type="text"
                required
                class="ui-input"
              >
            </label>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('employees.fields.nationalCode') }}</span>
              <input
                v-model="form.nationalCode"
                type="text"
                required
                maxlength="10"
                class="ui-input"
              >
            </label>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('employees.fields.employeeId') }}</span>
              <input
                v-model="form.employeeId"
                type="text"
                required
                class="ui-input"
              >
            </label>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('employees.fields.role') }}</span>
              <input
                v-model="form.role"
                type="text"
                required
                class="ui-input"
              >
            </label>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('employees.fields.school') }}</span>
              <select
                v-model="form.schoolId"
                required
                class="ui-input"
              >
                <option v-for="school in schools" :key="school.id" :value="school.id">
                  {{ school.name }} — {{ school.branch }}
                </option>
              </select>
            </label>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('employees.fields.baseSalary') }}</span>
              <CurrencyField
                v-model="form.baseSalary"
                required
              />
            </label>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('employees.fields.insuranceCost') }}</span>
              <CurrencyField
                v-model="form.insuranceCost"
                :min="0"
                required
              />
            </label>
            <div class="flex flex-wrap gap-3 sm:col-span-2">
              <button
                type="submit"
                :disabled="!canSaveEmployee"
                class="ui-btn-primary"
              >
                {{ isSubmitting ? $t('common.saving') : $t('employees.saveEmployee') }}
              </button>
              <button
                type="button"
                class="ui-btn-danger"
                @click="removeEmployee"
              >
                {{ $t('employees.deleteEmployee') }}
              </button>
            </div>
          </form>
        </section>

        <section>
          <h3 class="ui-section-header mb-4">
            {{ $t('employees.expenses') }}
          </h3>

          <div
            v-if="isLoadingTransactions"
            aria-busy="true"
            :aria-label="$t('common.loading')"
          >
            <ul class="mb-6 space-y-3 md:hidden">
              <li
                v-for="n in 3"
                :key="n"
                class="ui-card space-y-2 p-4"
              >
                <div class="ui-skeleton h-6 w-32" />
                <div class="ui-skeleton h-4 w-24" />
                <div class="ui-skeleton h-4 w-40" />
                <div class="flex gap-2 pt-1">
                  <div class="ui-skeleton h-11 flex-1 rounded-lg" />
                  <div class="ui-skeleton h-11 flex-1 rounded-lg" />
                </div>
              </li>
            </ul>
            <div class="mb-6 hidden space-y-3 md:block">
              <div v-for="n in 3" :key="n" class="ui-skeleton h-10 w-full rounded-lg" />
            </div>
          </div>
          <div
            v-else-if="transactions.length === 0"
            class="ui-empty-state mb-4 py-8"
          >
            {{ $t('employees.noExpenses') }}
          </div>
          <template v-else>
            <TransitionGroup
              tag="ul"
              name="list-item"
              appear
              class="mb-6 space-y-3 md:hidden"
            >
              <li
                v-for="transaction in transactions"
                :key="transaction.id"
                class="ui-card p-4"
              >
                <div class="text-lg font-semibold">
                  {{ numberFormatter.format(transaction.amountPaid) }}
                </div>
                <div class="mt-1 text-sm ui-text-muted">
                  {{ formatTransactionDate(transaction.date) }}
                </div>
                <div class="mt-0.5 text-sm ui-text-secondary">
                  {{ $t(`operator.transactionTypes.${transaction.transactionType}`) }}
                </div>
                <div class="mt-3 flex gap-2">
                  <button
                    type="button"
                    class="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 text-sm font-medium text-violet-400 transition-colors duration-200 hover:bg-violet-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                    @click="startEditExpense(transaction)"
                  >
                    {{ $t('employees.editExpense') }}
                  </button>
                  <button
                    type="button"
                    class="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 text-sm font-medium text-rose-400 transition-colors duration-200 hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                    @click="deleteExpense(transaction)"
                  >
                    {{ $t('common.delete') }}
                  </button>
                </div>
              </li>
            </TransitionGroup>
            <div class="ui-table-scroll mb-6 hidden md:block">
              <table class="ui-table">
                <thead class="ui-table-head">
                  <tr>
                    <th class="ui-table-th">
                      {{ $t('employees.columns.date') }}
                    </th>
                    <th class="ui-table-th">
                      {{ $t('employees.columns.amount') }}
                    </th>
                    <th class="ui-table-th">
                      {{ $t('employees.columns.type') }}
                    </th>
                    <th class="px-4 py-2 text-end text-xs font-semibold uppercase tracking-wide ui-text-muted">
                      {{ $t('employees.columns.actions') }}
                    </th>
                  </tr>
                </thead>
                <TransitionGroup
                  tag="tbody"
                  name="list-item"
                  appear
                  class="ui-divide-y"
                >
                  <tr v-for="transaction in transactions" :key="transaction.id" class="ui-table-row">
                    <td class="px-4 py-2">
                      {{ formatTransactionDate(transaction.date) }}
                    </td>
                    <td class="px-4 py-2">
                      {{ numberFormatter.format(transaction.amountPaid) }}
                    </td>
                    <td class="px-4 py-2 ui-text-muted">
                      {{ $t(`operator.transactionTypes.${transaction.transactionType}`) }}
                    </td>
                    <td class="px-4 py-2 text-end">
                      <button
                        type="button"
                        class="me-1 inline-flex items-center rounded-md px-2 py-1 text-violet-400 transition-colors duration-200 hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                        @click="startEditExpense(transaction)"
                      >
                        {{ $t('employees.editExpense') }}
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center rounded-md px-2 py-1 text-rose-400 transition-colors duration-200 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                        @click="deleteExpense(transaction)"
                      >
                        {{ $t('common.delete') }}
                      </button>
                    </td>
                  </tr>
                </TransitionGroup>
              </table>
            </div>
          </template>

          <form class="grid gap-4 ui-inset-panel sm:grid-cols-2" @submit.prevent="submitExpense">
            <p class="ui-label sm:col-span-2">
              {{ editingTransactionId ? $t('employees.editExpenseForm') : $t('employees.addExpense') }}
            </p>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('employees.fields.amount') }}</span>
              <CurrencyField
                v-model="expenseAmount"
                required
              />
            </label>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('employees.fields.type') }}</span>
              <select
                v-model="transactionType"
                required
                class="ui-input"
              >
                <option v-for="type in transactionTypes" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
            </label>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('employees.fields.date') }}</span>
              <PersianDateField
                v-model="expenseDate"
                required
              />
            </label>
            <div class="flex flex-wrap gap-3 sm:col-span-2">
              <button
                type="submit"
                :disabled="!canSubmitExpense"
                class="ui-btn-primary"
              >
                {{ isSubmitting ? $t('common.saving') : (editingTransactionId ? $t('employees.updateExpense') : $t('employees.addExpenseButton')) }}
              </button>
              <button
                v-if="editingTransactionId"
                type="button"
                class="ui-btn-secondary"
                @click="resetExpenseForm"
              >
                {{ $t('employees.cancelEdit') }}
              </button>
            </div>
            <p
              v-if="expenseError"
              class="text-sm text-rose-400 sm:col-span-2"
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
