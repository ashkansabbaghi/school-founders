<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { PaymentMethod, Student, StudentTransaction } from '#shared/types/financial'
import { formatIsoDateDisplay, todayIso } from '#shared/utils/jalaliDate'
import { matchesListSearch } from '~/utils/listSearch'

const props = defineProps<{
  student: Student
}>()

const emit = defineEmits<{
  close: []
  updated: [student: Student]
  removed: []
  changed: []
}>()

const { t, locale } = useI18n()
const financeStore = useFinanceStore()
const { schools, termYear, isSubmitting, submitError } = storeToRefs(financeStore)

const transactions = ref<StudentTransaction[]>([])
const transactionSearchQuery = ref('')
const isLoadingTransactions = ref(true)
const editingTransactionId = ref<string | null>(null)

const form = reactive({
  fullName: '',
  nationalCode: '',
  studentId: '',
  grade: '',
  schoolId: '',
  fullPrice: '' as number | '',
  dynamicDiscountRate: '' as number | '',
  parentName: '',
  parentPhone: '',
})

const paymentAmount = ref<number | ''>('')
const paymentMethod = ref<PaymentMethod>('bankTransfer')
const paymentDate = ref('')

const numberFormatter = computed(() =>
  new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US'),
)

const paymentMethods = computed(() => [
  { value: 'cash' as PaymentMethod, label: t('operator.paymentMethods.cash') },
  { value: 'card' as PaymentMethod, label: t('operator.paymentMethods.card') },
  { value: 'bankTransfer' as PaymentMethod, label: t('operator.paymentMethods.bankTransfer') },
  { value: 'cheque' as PaymentMethod, label: t('operator.paymentMethods.cheque') },
])

const paymentSummary = computed(() =>
  financeStore.studentPaymentSummary(props.student, transactions.value),
)

const filteredTransactions = computed(() =>
  transactions.value.filter(transaction =>
    matchesListSearch(transactionSearchQuery.value, [
      transaction.date,
      formatTransactionDate(transaction.date),
      transaction.amountPaid,
      numberFormatter.value.format(transaction.amountPaid),
      t(`operator.paymentMethods.${transaction.paymentMethod}`),
    ]),
  ),
)

const isTransactionSearchEmpty = computed(() =>
  transactionSearchQuery.value.trim().length > 0
  && transactions.value.length > 0
  && filteredTransactions.value.length === 0,
)

const { paginatedItems, meta, goNext, goPrevious } = usePagination(filteredTransactions)

const progressPercent = computed(() => {
  if (paymentSummary.value.expected <= 0) {
    return 0
  }

  return Math.min(100, (paymentSummary.value.paid / paymentSummary.value.expected) * 100)
})

const statusClasses = computed(() => {
  switch (paymentSummary.value.status) {
    case 'paid':
      return 'ui-badge-paid'
    case 'partial':
      return 'ui-badge-warning'
    default:
      return 'ui-badge-danger'
  }
})

const canSaveStudent = computed(() =>
  Boolean(
    form.fullName.trim()
    && form.nationalCode.trim()
    && form.studentId.trim()
    && form.grade.trim()
    && form.schoolId
    && form.fullPrice !== ''
    && Number(form.fullPrice) > 0
    && form.dynamicDiscountRate !== ''
    && Number(form.dynamicDiscountRate) >= 0
    && Number(form.dynamicDiscountRate) <= 1
    && form.parentName.trim()
    && form.parentPhone.trim()
    && !isSubmitting.value,
  ),
)

const canSubmitPayment = computed(() =>
  Boolean(
    paymentAmount.value !== ''
    && Number(paymentAmount.value) > 0
    && paymentMethod.value
    && paymentDate.value
    && !isSubmitting.value,
  ),
)

function formatTransactionDate(date: string): string {
  return formatIsoDateDisplay(date)
}

function resetFormFromStudent(student: Student) {
  form.fullName = student.fullName
  form.nationalCode = student.nationalCode
  form.studentId = student.studentId
  form.grade = student.grade
  form.schoolId = student.schoolId
  form.fullPrice = student.fullPrice
  form.dynamicDiscountRate = student.dynamicDiscountRate
  form.parentName = student.parentName
  form.parentPhone = student.parentPhone
}

function resetPaymentForm() {
  editingTransactionId.value = null
  paymentAmount.value = ''
  paymentMethod.value = 'bankTransfer'
  paymentDate.value = todayIso()
}

async function loadTransactions() {
  isLoadingTransactions.value = true

  try {
    transactions.value = await financeStore.fetchStudentTransactions(props.student.id)
    emit('changed')
  }
  finally {
    isLoadingTransactions.value = false
  }
}

async function saveStudentViaStore() {
  if (!canSaveStudent.value) {
    return
  }

  financeStore.clearSubmitFeedback()

  try {
    const updated = await financeStore.saveStudent({
      id: props.student.id,
      fullName: form.fullName.trim(),
      nationalCode: form.nationalCode.trim(),
      studentId: form.studentId.trim(),
      grade: form.grade.trim(),
      schoolId: form.schoolId,
      fullPrice: Number(form.fullPrice),
      dynamicDiscountRate: Number(form.dynamicDiscountRate),
      parentName: form.parentName.trim(),
      parentPhone: form.parentPhone.trim(),
    })

    if (updated) {
      emit('updated', updated)
    }
  }
  catch {
    // Error handled by store
  }
}

async function removeStudent() {
  if (!confirm(t('students.confirmDelete'))) {
    return
  }

  financeStore.clearSubmitFeedback()

  try {
    await financeStore.removeStudent(props.student.id)
    emit('removed')
  }
  catch {
    // Error handled by store
  }
}

function startEditPayment(transaction: StudentTransaction) {
  editingTransactionId.value = transaction.id
  paymentAmount.value = transaction.amountPaid
  paymentMethod.value = transaction.paymentMethod
  paymentDate.value = transaction.date
}

async function submitPayment() {
  if (!canSubmitPayment.value) {
    return
  }

  financeStore.clearSubmitFeedback()

  const payload = {
    studentId: props.student.id,
    schoolId: props.student.schoolId,
    amountPaid: Number(paymentAmount.value),
    paymentMethod: paymentMethod.value,
    date: paymentDate.value,
  }

  try {
    if (editingTransactionId.value) {
      await financeStore.updateStudentTransaction(editingTransactionId.value, payload)
    }
    else {
      await financeStore.logStudentPayment(payload)
    }

    resetPaymentForm()
    await loadTransactions()
  }
  catch {
    // Error handled by store
  }
}

async function deletePayment(transaction: StudentTransaction) {
  if (!confirm(t('students.confirmDeletePayment'))) {
    return
  }

  financeStore.clearSubmitFeedback()

  try {
    await financeStore.deleteStudentTransaction(transaction.id)

    if (editingTransactionId.value === transaction.id) {
      resetPaymentForm()
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
  () => props.student,
  (student) => {
    resetFormFromStudent(student)
  },
  { immediate: true },
)

onMounted(() => {
  paymentDate.value = todayIso()
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
      :aria-label="$t('students.modalTitle', { name: student.fullName })"
      class="ui-modal-panel max-w-3xl sm:my-8"
    >
      <header class="ui-modal-header">
        <div class="min-w-0">
          <h2 class="text-lg font-semibold">
            {{ student.fullName }}
          </h2>
          <p class="mt-1 text-sm ui-text-muted">
            {{ student.studentId }} — {{ $t('students.termYear', { termYear }) }}
          </p>
        </div>
        <button
          type="button"
          class="ui-modal-close"
          :aria-label="$t('students.close')"
          @click="emit('close')"
        >
          ✕
        </button>
      </header>

      <div class="scrollbar-thin px-4 py-5 sm:max-h-[calc(100vh-8rem)] sm:overflow-y-auto sm:px-6">
        <section class="mb-8">
          <h3 class="ui-section-header mb-4">
            {{ $t('students.paymentSummary') }}
          </h3>
          <div class="ui-inset-panel">
            <div class="mb-3 flex flex-wrap items-center gap-3">
              <span :class="statusClasses">
                {{ $t(`students.status.${paymentSummary.status}`) }}
              </span>
              <span class="text-sm ui-text-muted">
                {{ $t('students.paidOfExpected', {
                  paid: numberFormatter.format(paymentSummary.paid),
                  expected: numberFormatter.format(paymentSummary.expected),
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
              {{ $t('students.remaining', { amount: numberFormatter.format(paymentSummary.remaining) }) }}
            </p>
          </div>
        </section>

        <section class="mb-8">
          <h3 class="ui-section-header mb-4">
            {{ $t('students.studentInfo') }}
          </h3>
          <div
            v-if="submitError"
            class="ui-alert-error mb-4"
            role="alert"
          >
            {{ submitError }}
          </div>
          <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="saveStudentViaStore">
            <label class="block space-y-1 sm:col-span-2">
              <span class="ui-label">{{ $t('students.fields.fullName') }}</span>
              <input
                v-model="form.fullName"
                type="text"
                required
                class="ui-input"
              >
            </label>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('students.fields.nationalCode') }}</span>
              <input
                v-model="form.nationalCode"
                type="text"
                required
                maxlength="10"
                class="ui-input"
              >
            </label>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('students.fields.studentId') }}</span>
              <input
                v-model="form.studentId"
                type="text"
                required
                class="ui-input"
              >
            </label>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('students.fields.grade') }}</span>
              <input
                v-model="form.grade"
                type="text"
                required
                class="ui-input"
              >
            </label>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('students.fields.school') }}</span>
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
              <span class="ui-label">{{ $t('students.fields.fullPrice') }}</span>
              <CurrencyField
                v-model="form.fullPrice"
                required
              />
            </label>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('students.fields.discountRate') }}</span>
              <input
                v-model.number="form.dynamicDiscountRate"
                type="number"
                min="0"
                max="1"
                step="0.01"
                required
                class="ui-input"
              >
            </label>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('students.fields.parentName') }}</span>
              <input
                v-model="form.parentName"
                type="text"
                required
                class="ui-input"
              >
            </label>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('students.fields.parentPhone') }}</span>
              <input
                v-model="form.parentPhone"
                type="tel"
                required
                class="ui-input"
              >
            </label>
            <div class="flex flex-wrap gap-3 sm:col-span-2">
              <button
                type="submit"
                :disabled="!canSaveStudent"
                class="ui-btn-primary"
              >
                {{ isSubmitting ? $t('common.saving') : $t('students.saveStudent') }}
              </button>
              <button
                type="button"
                class="ui-btn-danger"
                @click="removeStudent"
              >
                {{ $t('students.deleteStudent') }}
              </button>
            </div>
          </form>
        </section>

        <section>
          <h3 class="ui-section-header mb-4">
            {{ $t('students.payments') }}
          </h3>

          <ListSearchInput
            v-model="transactionSearchQuery"
            class="mb-4"
            :placeholder="$t('students.paymentsSearchPlaceholder')"
            :disabled="transactions.length === 0"
          />

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
            {{ $t('students.noPayments') }}
          </div>
          <div
            v-else-if="isTransactionSearchEmpty"
            class="ui-empty-state mb-4 py-8"
          >
            {{ $t('common.noSearchResults') }}
          </div>
          <template v-else>
            <TransitionGroup
              tag="ul"
              name="list-item"
              appear
              class="mb-6 space-y-3 md:hidden"
            >
              <li
                v-for="transaction in paginatedItems"
                :key="transaction.id"
                class="ui-card p-4"
              >
                <div class="text-lg font-semibold">
                  <ListSearchHighlight
                    :text="numberFormatter.format(transaction.amountPaid)"
                    :query="transactionSearchQuery"
                  />
                </div>
                <div class="mt-1 text-sm ui-text-muted">
                  <ListSearchHighlight
                    :text="formatTransactionDate(transaction.date)"
                    :query="transactionSearchQuery"
                  />
                </div>
                <div class="mt-0.5 text-sm ui-text-secondary">
                  <ListSearchHighlight
                    :text="$t(`operator.paymentMethods.${transaction.paymentMethod}`)"
                    :query="transactionSearchQuery"
                  />
                </div>
                <div class="mt-3 flex gap-2">
                  <button
                    type="button"
                    class="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 text-sm font-medium text-violet-400 transition-colors duration-200 hover:bg-violet-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                    @click="startEditPayment(transaction)"
                  >
                    {{ $t('students.editPayment') }}
                  </button>
                  <button
                    type="button"
                    class="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 text-sm font-medium text-rose-400 transition-colors duration-200 hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                    @click="deletePayment(transaction)"
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
                      {{ $t('students.columns.date') }}
                    </th>
                    <th class="ui-table-th">
                      {{ $t('students.columns.amount') }}
                    </th>
                    <th class="ui-table-th">
                      {{ $t('students.columns.method') }}
                    </th>
                    <th class="px-4 py-2 text-end text-xs font-semibold uppercase tracking-wide ui-text-muted">
                      {{ $t('students.columns.actions') }}
                    </th>
                  </tr>
                </thead>
                <TransitionGroup
                  tag="tbody"
                  name="list-item"
                  appear
                  class="ui-divide-y"
                >
                  <tr v-for="transaction in paginatedItems" :key="transaction.id" class="ui-table-row">
                    <td class="px-4 py-2">
                      <ListSearchHighlight
                        :text="formatTransactionDate(transaction.date)"
                        :query="transactionSearchQuery"
                      />
                    </td>
                    <td class="px-4 py-2">
                      <ListSearchHighlight
                        :text="numberFormatter.format(transaction.amountPaid)"
                        :query="transactionSearchQuery"
                      />
                    </td>
                    <td class="px-4 py-2 ui-text-muted">
                      <ListSearchHighlight
                        :text="$t(`operator.paymentMethods.${transaction.paymentMethod}`)"
                        :query="transactionSearchQuery"
                      />
                    </td>
                    <td class="px-4 py-2 text-end">
                      <button
                        type="button"
                        class="me-1 inline-flex items-center rounded-md px-2 py-1 text-violet-400 transition-colors duration-200 hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                        @click="startEditPayment(transaction)"
                      >
                        {{ $t('students.editPayment') }}
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center rounded-md px-2 py-1 text-rose-400 transition-colors duration-200 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                        @click="deletePayment(transaction)"
                      >
                        {{ $t('common.delete') }}
                      </button>
                    </td>
                  </tr>
                </TransitionGroup>
              </table>
            </div>
            <ListPagination
              v-if="meta.showPagination"
              :meta="meta"
              @previous="goPrevious"
              @next="goNext"
            />
          </template>

          <form class="grid gap-4 ui-inset-panel sm:grid-cols-2" @submit.prevent="submitPayment">
            <p class="ui-label sm:col-span-2">
              {{ editingTransactionId ? $t('students.editPaymentForm') : $t('students.addPayment') }}
            </p>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('students.fields.amount') }}</span>
              <CurrencyField
                v-model="paymentAmount"
                required
              />
            </label>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('students.fields.paymentMethod') }}</span>
              <select
                v-model="paymentMethod"
                required
                class="ui-input"
              >
                <option v-for="method in paymentMethods" :key="method.value" :value="method.value">
                  {{ method.label }}
                </option>
              </select>
            </label>
            <label class="block space-y-1">
              <span class="ui-label">{{ $t('students.fields.date') }}</span>
              <PersianDateField
                v-model="paymentDate"
                required
              />
            </label>
            <div class="flex flex-wrap gap-3 sm:col-span-2">
              <button
                type="submit"
                :disabled="!canSubmitPayment"
                class="ui-btn-primary"
              >
                {{ isSubmitting ? $t('common.saving') : (editingTransactionId ? $t('students.updatePayment') : $t('students.addPaymentButton')) }}
              </button>
              <button
                v-if="editingTransactionId"
                type="button"
                class="ui-btn-secondary"
                @click="resetPaymentForm"
              >
                {{ $t('students.cancelEdit') }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  </div>
</template>
