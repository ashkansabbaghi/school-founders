<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Employee, EmployeeTransaction } from '#shared/types/financial'
import {
  EXPENSE_STATUSES,
  indexTransactionsByPersonId,
  matchesSelectFilter,
} from '~/utils/listFilters'
import { matchesListSearch } from '~/utils/listSearch'

const { t } = useI18n()
const financeStore = useFinanceStore()
const { schools, employees, termYear, error, submitMessage } = storeToRefs(financeStore)

useHead({
  title: () => t('employees.title'),
})

const selectedSchoolId = ref('')
const selectedStatus = ref('')
const searchQuery = ref('')
const transactions = ref<EmployeeTransaction[]>([])
const isLoadingTransactions = ref(true)
const selectedEmployee = ref<Employee | null>(null)
const showAddModal = ref(false)

const schoolFilteredEmployees = computed(() =>
  selectedSchoolId.value
    ? employees.value.filter(employee => employee.schoolId === selectedSchoolId.value)
    : employees.value,
)

const transactionsByEmployeeId = computed(() =>
  indexTransactionsByPersonId(transactions.value, 'employeeId'),
)

const filteredEmployees = computed(() =>
  schoolFilteredEmployees.value.filter((employee) => {
    const summary = financeStore.employeeExpenseSummary(
      employee,
      transactionsByEmployeeId.value.get(employee.id) ?? [],
    )

    if (!matchesSelectFilter(summary.status, selectedStatus.value)) {
      return false
    }

    return matchesListSearch(searchQuery.value, [
      employee.fullName,
      employee.employeeId,
    ])
  }),
)

const hasActiveFilters = computed(() =>
  searchQuery.value.trim().length > 0
  || selectedStatus.value !== '',
)

const isSearchEmpty = computed(() =>
  hasActiveFilters.value
  && schoolFilteredEmployees.value.length > 0
  && filteredEmployees.value.length === 0,
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
  await financeStore.ensureReady()
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
      <div class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <!-- search input -->
        <div class="block max-w-md flex-1 space-y-1">
          <span class="ui-label">{{ $t('common.search') }}</span>
          <ListSearchInput
            v-model="searchQuery"
            :placeholder="$t('employees.searchPlaceholder')"
          />
        </div>

        <!-- filter -->
        <label class="block max-w-md flex-1 space-y-1">
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
        <label class="block max-w-md flex-1 space-y-1">
          <span class="ui-label">{{ $t('employees.columns.status') }}</span>
          <select
            v-model="selectedStatus"
            class="ui-input"
          >
            <option value="">
              {{ $t('employees.allStatuses') }}
            </option>
            <option v-for="status in EXPENSE_STATUSES" :key="status" :value="status">
              {{ $t(`employees.status.${status}`) }}
            </option>
          </select>
        </label>
       
      </div>
    </section>

    <EmployeeList
      :employees="filteredEmployees"
      :transactions="transactions"
      :is-loading="isLoadingTransactions"
      :is-search-empty="isSearchEmpty"
      :search-query="searchQuery"
      @select="openEmployee"
    />

    <LazyEmployeeAddModal
      v-if="showAddModal"
      :default-school-id="selectedSchoolId || undefined"
      @close="closeAddModal"
    />

    <LazyEmployeeDetailModal
      v-if="selectedEmployee"
      :employee="selectedEmployee"
      @close="closeModal"
      @updated="onEmployeeUpdated"
      @removed="onEmployeeRemoved"
      @changed="loadTransactions"
    />
  </main>
</template>
