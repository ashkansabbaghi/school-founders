<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { PaymentMethod } from '#shared/types/financial'
import { getExpectedTuition } from '#shared/utils/tuition'
import { todayIso } from '#shared/utils/jalaliDate'

const { t, locale } = useI18n()
const financeStore = useFinanceStore()
const { schools, isSubmitting } = storeToRefs(financeStore)

const studentSchoolId = ref('')
const studentId = ref('')
const studentAmount = ref<number | ''>('')
const paymentMethod = ref<PaymentMethod>('bankTransfer')
const studentDate = ref(todayIso())

const numberFormatter = computed(() =>
  new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US'),
)

const paymentMethods = computed(() => [
  { value: 'cash' as PaymentMethod, label: t('operator.paymentMethods.cash') },
  { value: 'card' as PaymentMethod, label: t('operator.paymentMethods.card') },
  { value: 'bankTransfer' as PaymentMethod, label: t('operator.paymentMethods.bankTransfer') },
  { value: 'cheque' as PaymentMethod, label: t('operator.paymentMethods.cheque') },
])

const filteredStudents = computed(() =>
  studentSchoolId.value ? financeStore.studentsBySchool(studentSchoolId.value) : [],
)

const selectedStudent = computed(() =>
  filteredStudents.value.find(student => student.id === studentId.value) ?? null,
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
</script>

<template>
  <form
    class="space-y-4"
    @submit.prevent="submitStudent"
  >
    <label class="block space-y-1">
      <span class="ui-label">{{ $t('operator.fields.school') }}</span>
      <select
        v-model="studentSchoolId"
        required
        class="ui-input"
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
      <span class="ui-label">{{ $t('operator.fields.student') }}</span>
      <select
        v-model="studentId"
        required
        :disabled="!studentSchoolId"
        class="ui-input disabled:cursor-not-allowed disabled:opacity-50"
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
      <span class="ui-label">{{ $t('operator.fields.grade') }}</span>
      <input
        :value="selectedStudent?.grade ?? ''"
        type="text"
        disabled
        class="ui-input disabled:cursor-not-allowed disabled:opacity-50"
        :placeholder="$t('operator.placeholders.autoFilledStudent')"
      >
    </label>

    <label class="block space-y-1">
      <span class="ui-label">{{ $t('operator.fields.amount') }}</span>
      <CurrencyField
        v-model="studentAmount"
        required
      />
      <p v-if="suggestedStudentAmount !== null" class="text-xs text-zinc-500">
        {{ $t('operator.suggestedAmount', { amount: numberFormatter.format(suggestedStudentAmount) }) }}
      </p>
    </label>

    <label class="block space-y-1">
      <span class="ui-label">{{ $t('operator.fields.paymentMethod') }}</span>
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
      <span class="ui-label">{{ $t('operator.fields.date') }}</span>
      <PersianDateField
        v-model="studentDate"
        required
      />
    </label>

    <button
      type="submit"
      :disabled="!canSubmitStudent"
      class="ui-btn-primary"
    >
      {{ isSubmitting ? $t('common.saving') : $t('operator.submitStudent') }}
    </button>
  </form>
</template>
