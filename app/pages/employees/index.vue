<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Employee, EmployeeTransaction } from '#shared/types/financial'

const { t } = useI18n()
const financeStore = useFinanceStore()
const { schools, employees, termYear, operatorName, error, submitMessage } = storeToRefs(financeStore)

useHead({
  title: () => t('employees.title'),
})

const selectedSchoolId = ref('')
const transactions = ref<EmployeeTransaction[]>([])
const isLoadingTransactions = ref(true)
const selectedEmployee = ref<Employee | null>(null)
const showAddModal = ref(false)

const filteredEmployees = computed(() =>
  selectedSchoolId.value
    ? employees.value.filter(employee => employee.schoolId === selectedSchoolId.value)
    : employees.value,
)

async function loadTransactions() {
  isLoadingTransactions.value = true

  try {
    transactions.value = await financeStore.fetchEmployeeTransactionsForTerm()
  }
  finally {
    isLoadingTransactions.value = false
  }
}

function onTermYearInput(event: Event) {
  financeStore.setTermYear((event.target as HTMLInputElement).value)
  void loadTransactions()
}

function onOperatorInput(event: Event) {
  financeStore.setOperatorName((event.target as HTMLInputElement).value)
}

function openAddModal() {
  financeStore.clearSubmitFeedback()
  showAddModal.value = true
}

function closeAddModal() {
  showAddModal.value = false
}

function openEmployee(employee: Employee) {
  selectedEmployee.value = employee
}

function closeModal() {
  selectedEmployee.value = null
}

function onEmployeeUpdated(employee: Employee) {
  selectedEmployee.value = employee
}

function onEmployeeRemoved() {
  selectedEmployee.value = null
  void loadTransactions()
}

watch(termYear, () => {
  void loadTransactions()
})

onMounted(async () => {
  if (financeStore.employees.length === 0) {
    await financeStore.init()
  }
  else {
    await financeStore.fetchMasterData()
  }

  await loadTransactions()
})
</script>

<template>
  <main class="mx-auto max-w-6xl space-y-8 p-4 sm:p-6">
    <header class="ui-page-header">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="ui-page-title">
            {{ $t('employees.title') }}
          </h1>
          <p class="ui-page-subtitle">
            {{ $t('employees.subtitle') }}
          </p>
        </div>
        <button
          type="button"
          class="ui-page-add-btn"
          :aria-label="$t('employees.addButtonLabel')"
          @click="openAddModal"
        >
          +
        </button>
      </div>
    </header>

    <div
      v-if="submitMessage"
      class="ui-alert-success"
      role="status"
    >
      {{ submitMessage }}
    </div>
    <div
      v-if="error"
      class="ui-alert-error"
      role="alert"
    >
      {{ error }}
    </div>

    <section class="ui-card p-4 sm:p-6">
      <div class="grid gap-4 sm:grid-cols-3">
        <label class="block space-y-1">
          <span class="ui-label">{{ $t('operator.fields.termYear') }}</span>
          <input
            :value="termYear"
            type="text"
            class="ui-input"
            :placeholder="$t('operator.placeholders.termYear')"
            @input="onTermYearInput"
          >
        </label>
        <label class="block space-y-1">
          <span class="ui-label">{{ $t('operator.fields.operatorName') }}</span>
          <input
            :value="operatorName"
            type="text"
            class="ui-input"
            :placeholder="$t('operator.placeholders.operatorName')"
            @input="onOperatorInput"
          >
        </label>
        <label class="block space-y-1">
          <span class="ui-label">{{ $t('employees.fields.school') }}</span>
          <select
            v-model="selectedSchoolId"
            class="ui-input"
          >
            <option value="">
              {{ $t('employees.allSchools') }}
            </option>
            <option v-for="school in schools" :key="school.id" :value="school.id">
              {{ school.name }} — {{ school.branch }}
            </option>
          </select>
        </label>
      </div>
    </section>

    <EmployeeList
      :employees="filteredEmployees"
      :transactions="transactions"
      :is-loading="isLoadingTransactions"
      @select="openEmployee"
    />

    <EmployeeAddModal
      v-if="showAddModal"
      :default-school-id="selectedSchoolId || undefined"
      @close="closeAddModal"
    />

    <EmployeeDetailModal
      v-if="selectedEmployee"
      :employee="selectedEmployee"
      @close="closeModal"
      @updated="onEmployeeUpdated"
      @removed="onEmployeeRemoved"
      @changed="loadTransactions"
    />
  </main>
</template>
