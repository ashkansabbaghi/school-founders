<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { PaymentMethod, Student, StudentTransaction } from '#shared/types/financial'

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
const { schools, termYear, operatorName, isSubmitting, error, submitMessage } = storeToRefs(financeStore)

const transactions = ref<StudentTransaction[]>([])
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
const paymentError = ref<string | null>(null)

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

const progressPercent = computed(() => {
  if (paymentSummary.value.expected <= 0) {
    return 0
  }

  return Math.min(100, (paymentSummary.value.paid / paymentSummary.value.expected) * 100)
})

const statusClasses = computed(() => {
  switch (paymentSummary.value.status) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-800'
    case 'partial':
      return 'bg-amber-100 text-amber-800'
    default:
      return 'bg-rose-100 text-rose-800'
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
    && operatorName.value.trim()
    && !isSubmitting.value,
  ),
)

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
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
  paymentError.value = null
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
  paymentError.value = null
}

async function submitPayment() {
  if (!canSubmitPayment.value) {
    return
  }

  paymentError.value = null
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
  catch (err) {
    paymentError.value = financeStore.error
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
    class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
    @click.self="emit('close')"
  >
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="$t('students.modalTitle', { name: student.fullName })"
      class="my-8 w-full max-w-3xl rounded-xl border border-gray-200 bg-white shadow-xl"
    >
      <header class="flex items-start justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">
            {{ student.fullName }}
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            {{ student.studentId }} — {{ $t('students.termYear', { termYear }) }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          :aria-label="$t('students.close')"
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
            {{ $t('students.paymentSummary') }}
          </h3>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="mb-3 flex flex-wrap items-center gap-3">
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                :class="statusClasses"
              >
                {{ $t(`students.status.${paymentSummary.status}`) }}
              </span>
              <span class="text-sm text-gray-600">
                {{ $t('students.paidOfExpected', {
                  paid: numberFormatter.format(paymentSummary.paid),
                  expected: numberFormatter.format(paymentSummary.expected),
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
              {{ $t('students.remaining', { amount: numberFormatter.format(paymentSummary.remaining) }) }}
            </p>
          </div>
        </section>

        <section class="mb-8">
          <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {{ $t('students.studentInfo') }}
          </h3>
          <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="saveStudentViaStore">
            <label class="block space-y-1 sm:col-span-2">
              <span class="text-sm font-medium text-gray-700">{{ $t('students.fields.fullName') }}</span>
              <input
                v-model="form.fullName"
                type="text"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">{{ $t('students.fields.nationalCode') }}</span>
              <input
                v-model="form.nationalCode"
                type="text"
                required
                maxlength="10"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">{{ $t('students.fields.studentId') }}</span>
              <input
                v-model="form.studentId"
                type="text"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">{{ $t('students.fields.grade') }}</span>
              <input
                v-model="form.grade"
                type="text"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">{{ $t('students.fields.school') }}</span>
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
              <span class="text-sm font-medium text-gray-700">{{ $t('students.fields.fullPrice') }}</span>
              <input
                v-model.number="form.fullPrice"
                type="number"
                min="1"
                step="1"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">{{ $t('students.fields.discountRate') }}</span>
              <input
                v-model.number="form.dynamicDiscountRate"
                type="number"
                min="0"
                max="1"
                step="0.01"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">{{ $t('students.fields.parentName') }}</span>
              <input
                v-model="form.parentName"
                type="text"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">{{ $t('students.fields.parentPhone') }}</span>
              <input
                v-model="form.parentPhone"
                type="tel"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
            </label>
            <div class="flex flex-wrap gap-3 sm:col-span-2">
              <button
                type="submit"
                :disabled="!canSaveStudent"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {{ isSubmitting ? $t('common.saving') : $t('students.saveStudent') }}
              </button>
              <button
                type="button"
                class="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                @click="removeStudent"
              >
                {{ $t('students.deleteStudent') }}
              </button>
            </div>
          </form>
        </section>

        <section>
          <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {{ $t('students.payments') }}
          </h3>

          <div v-if="isLoadingTransactions" class="py-4 text-sm text-gray-500">
            {{ $t('common.loading') }}
          </div>
          <div
            v-else-if="transactions.length === 0"
            class="mb-4 rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500"
          >
            {{ $t('students.noPayments') }}
          </div>
          <div v-else class="mb-6 overflow-x-auto rounded-lg border border-gray-200">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-start font-medium text-gray-600">
                    {{ $t('students.columns.date') }}
                  </th>
                  <th class="px-4 py-2 text-start font-medium text-gray-600">
                    {{ $t('students.columns.amount') }}
                  </th>
                  <th class="px-4 py-2 text-start font-medium text-gray-600">
                    {{ $t('students.columns.method') }}
                  </th>
                  <th class="px-4 py-2 text-start font-medium text-gray-600">
                    {{ $t('students.columns.operator') }}
                  </th>
                  <th class="px-4 py-2 text-end font-medium text-gray-600">
                    {{ $t('students.columns.actions') }}
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
                    {{ $t(`operator.paymentMethods.${transaction.paymentMethod}`) }}
                  </td>
                  <td class="px-4 py-2 text-gray-600">
                    {{ transaction.operator }}
                  </td>
                  <td class="px-4 py-2 text-end">
                    <button
                      type="button"
                      class="me-2 text-indigo-600 hover:text-indigo-800"
                      @click="startEditPayment(transaction)"
                    >
                      {{ $t('students.editPayment') }}
                    </button>
                    <button
                      type="button"
                      class="text-rose-600 hover:text-rose-800"
                      @click="deletePayment(transaction)"
                    >
                      {{ $t('common.delete') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <form class="grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2" @submit.prevent="submitPayment">
            <p class="text-sm font-medium text-gray-700 sm:col-span-2">
              {{ editingTransactionId ? $t('students.editPaymentForm') : $t('students.addPayment') }}
            </p>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">{{ $t('students.fields.amount') }}</span>
              <input
                v-model.number="paymentAmount"
                type="number"
                min="1"
                step="1"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">{{ $t('students.fields.paymentMethod') }}</span>
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
              <span class="text-sm font-medium text-gray-700">{{ $t('students.fields.date') }}</span>
              <input
                v-model="paymentDate"
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
                :disabled="!canSubmitPayment"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {{ isSubmitting ? $t('common.saving') : (editingTransactionId ? $t('students.updatePayment') : $t('students.addPaymentButton')) }}
              </button>
              <button
                v-if="editingTransactionId"
                type="button"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
                @click="resetPaymentForm"
              >
                {{ $t('students.cancelEdit') }}
              </button>
            </div>
            <p
              v-if="paymentError"
              class="text-sm text-rose-600 sm:col-span-2"
              role="alert"
            >
              {{ paymentError }}
            </p>
          </form>
        </section>
      </div>
    </div>
  </div>
</template>
