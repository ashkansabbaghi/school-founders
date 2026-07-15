<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { EmployeeTransactionType } from '#shared/types/financial'
import { getExpectedPayroll } from '#shared/utils/payroll'
import { todayIso } from '#shared/utils/jalaliDate'

const { t } = useI18n()
const financeStore = useFinanceStore()
const { schools, isSubmitting } = storeToRefs(financeStore)

const employeeSchoolId = ref('')
const employeeId = ref('')
const transactionType = ref<Extract<EmployeeTransactionType, 'salary' | 'bonus'>>('salary')
const employeeAmount = ref<number | ''>('')
const employeeDate = ref(todayIso())

const transactionTypes = computed(() => [
  { value: 'salary' as const, label: t('operator.transactionTypes.salary') },
  { value: 'bonus' as const, label: t('operator.transactionTypes.bonus') },
])

const filteredEmployees = computed(() =>
  employeeSchoolId.value ? financeStore.employeesBySchool(employeeSchoolId.value) : [],
)

const selectedEmployee = computed(() =>
  filteredEmployees.value.find(employee => employee.id === employeeId.value) ?? null,
)

const canSubmitEmployee = computed(() =>
  Boolean(
    employeeSchoolId.value
    && employeeId.value
    && employeeAmount.value !== ''
    && Number(employeeAmount.value) > 0
    && transactionType.value
    && employeeDate.value
    && !isSubmitting.value,
  ),
)

watch(employeeSchoolId, () => {
  employeeId.value = ''
})

watch([employeeId, transactionType], () => {
  if (transactionType.value === 'salary' && selectedEmployee.value) {
    employeeAmount.value = getExpectedPayroll(selectedEmployee.value)
  }
})

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
  <form
    class="space-y-4"
    @submit.prevent="submitEmployee"
  >
    <label class="block space-y-1">
      <span class="ui-label">{{ $t('operator.fields.school') }}</span>
      <select
        v-model="employeeSchoolId"
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
      <span class="ui-label">{{ $t('operator.fields.staff') }}</span>
      <select
        v-model="employeeId"
        required
        :disabled="!employeeSchoolId"
        class="ui-input disabled:cursor-not-allowed disabled:opacity-50"
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
      <span class="ui-label">{{ $t('operator.fields.role') }}</span>
      <input
        :value="selectedEmployee?.role ?? ''"
        type="text"
        disabled
        class="ui-input disabled:cursor-not-allowed disabled:opacity-50"
        :placeholder="$t('operator.placeholders.autoFilledStaff')"
      >
    </label>

    <label class="block space-y-1">
      <span class="ui-label">{{ $t('operator.fields.type') }}</span>
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
      <span class="ui-label">{{ $t('operator.fields.amount') }}</span>
      <CurrencyField
        v-model="employeeAmount"
        required
      />
    </label>

    <label class="block space-y-1">
      <span class="ui-label">{{ $t('operator.fields.date') }}</span>
      <PersianDateField
        v-model="employeeDate"
        required
      />
    </label>

    <button
      type="submit"
      :disabled="!canSubmitEmployee"
      class="ui-btn-primary"
    >
      {{ isSubmitting ? $t('common.saving') : $t('operator.submitEmployee') }}
    </button>
  </form>
</template>
