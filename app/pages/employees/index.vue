<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Employee, EmployeeTransaction } from '#shared/types/financial'

const { t } = useI18n()
const financeStore = useFinanceStore()
const { schools, employees, termYear, operatorName, isSubmitting, error, submitMessage } = storeToRefs(financeStore)

useHead({
  title: () => t('employees.title'),
})

const selectedSchoolId = ref('')
const transactions = ref<EmployeeTransaction[]>([])
const isLoadingTransactions = ref(true)
const selectedEmployee = ref<Employee | null>(null)
const showAddForm = ref(false)

const addForm = reactive({
  fullName: '',
  nationalCode: '',
  employeeId: '',
  role: '',
  schoolId: '',
  baseSalary: '' as number | '',
  insuranceCost: 0,
})

const filteredEmployees = computed(() =>
  selectedSchoolId.value
    ? employees.value.filter(employee => employee.schoolId === selectedSchoolId.value)
    : employees.value,
)

const canAddEmployee = computed(() =>
  Boolean(
    addForm.fullName.trim()
    && addForm.nationalCode.trim()
    && addForm.employeeId.trim()
    && addForm.role.trim()
    && addForm.schoolId
    && addForm.baseSalary !== ''
    && Number(addForm.baseSalary) > 0
    && addForm.insuranceCost !== ''
    && Number(addForm.insuranceCost) >= 0
    && !isSubmitting.value,
  ),
)

async function loadTransactions() {
  isLoadingTransactions.value = true

  try {
    transactions.value = await $fetch<EmployeeTransaction[]>('/api/finance/employee-transactions', {
      query: { termYear: termYear.value },
    })
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

function resetAddForm() {
  addForm.fullName = ''
  addForm.nationalCode = ''
  addForm.employeeId = ''
  addForm.role = ''
  addForm.schoolId = selectedSchoolId.value || (schools.value[0]?.id ?? '')
  addForm.baseSalary = ''
  addForm.insuranceCost = 0
}

async function submitAddEmployee() {
  if (!canAddEmployee.value) {
    return
  }

  financeStore.clearSubmitFeedback()

  try {
    await financeStore.saveEmployee({
      fullName: addForm.fullName.trim(),
      nationalCode: addForm.nationalCode.trim(),
      employeeId: addForm.employeeId.trim(),
      role: addForm.role.trim(),
      schoolId: addForm.schoolId,
      baseSalary: Number(addForm.baseSalary),
      insuranceCost: Number(addForm.insuranceCost),
    })

    resetAddForm()
    showAddForm.value = false
  }
  catch {
    // Error handled by store
  }
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

watch(selectedSchoolId, (schoolId) => {
  if (showAddForm.value && schoolId) {
    addForm.schoolId = schoolId
  }
})

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

  if (schools.value[0]) {
    addForm.schoolId = schools.value[0].id
  }

  await loadTransactions()
})
</script>

<template>
  <main class="mx-auto max-w-6xl space-y-8 p-6">
    <header>
      <h1 class="text-2xl font-bold text-gray-900">
        {{ $t('employees.title') }}
      </h1>
      <p class="mt-1 text-sm text-gray-500">
        {{ $t('employees.subtitle') }}
      </p>
    </header>

    <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div class="grid gap-4 sm:grid-cols-3">
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
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            :placeholder="$t('operator.placeholders.operatorName')"
            @input="onOperatorInput"
          >
        </label>
        <label class="block space-y-1">
          <span class="text-sm font-medium text-gray-700">{{ $t('employees.fields.school') }}</span>
          <select
            v-model="selectedSchoolId"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

    <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div class="mb-4 flex items-center justify-between gap-4">
        <h2 class="text-lg font-semibold text-gray-900">
          {{ $t('employees.addEmployee') }}
        </h2>
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          @click="showAddForm = !showAddForm"
        >
          {{ showAddForm ? $t('employees.hideForm') : $t('employees.showForm') }}
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
        v-if="showAddForm"
        class="grid gap-4 sm:grid-cols-2"
        @submit.prevent="submitAddEmployee"
      >
        <label class="block space-y-1 sm:col-span-2">
          <span class="text-sm font-medium text-gray-700">{{ $t('employees.fields.fullName') }}</span>
          <input
            v-model="addForm.fullName"
            type="text"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
        </label>
        <label class="block space-y-1">
          <span class="text-sm font-medium text-gray-700">{{ $t('employees.fields.nationalCode') }}</span>
          <input
            v-model="addForm.nationalCode"
            type="text"
            required
            maxlength="10"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
        </label>
        <label class="block space-y-1">
          <span class="text-sm font-medium text-gray-700">{{ $t('employees.fields.employeeId') }}</span>
          <input
            v-model="addForm.employeeId"
            type="text"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
        </label>
        <label class="block space-y-1">
          <span class="text-sm font-medium text-gray-700">{{ $t('employees.fields.role') }}</span>
          <input
            v-model="addForm.role"
            type="text"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
        </label>
        <label class="block space-y-1">
          <span class="text-sm font-medium text-gray-700">{{ $t('employees.fields.school') }}</span>
          <select
            v-model="addForm.schoolId"
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
          <span class="text-sm font-medium text-gray-700">{{ $t('employees.fields.baseSalary') }}</span>
          <input
            v-model.number="addForm.baseSalary"
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
            v-model.number="addForm.insuranceCost"
            type="number"
            min="0"
            step="1"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
        </label>
        <div class="sm:col-span-2">
          <button
            type="submit"
            :disabled="!canAddEmployee"
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {{ isSubmitting ? $t('common.saving') : $t('employees.addEmployeeButton') }}
          </button>
        </div>
      </form>
    </section>

    <EmployeeList
      :employees="filteredEmployees"
      :transactions="transactions"
      :is-loading="isLoadingTransactions"
      @select="openEmployee"
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
