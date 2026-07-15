<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Student, StudentTransaction } from '#shared/types/financial'
import {
  collectUniqueGrades,
  indexTransactionsByPersonId,
  matchesSelectFilter,
  PAYMENT_STATUSES,
} from '~/utils/listFilters'
import { matchesListSearch } from '~/utils/listSearch'

const { t } = useI18n()
const financeStore = useFinanceStore()
const { schools, students, termYear, error, submitMessage } = storeToRefs(financeStore)

useHead({
  title: () => t('students.title'),
})

const selectedSchoolId = ref('')
const selectedGrade = ref('')
const selectedStatus = ref('')
const searchQuery = ref('')
const transactions = ref<StudentTransaction[]>([])
const isLoadingTransactions = ref(true)
const selectedStudent = ref<Student | null>(null)
const showAddModal = ref(false)

const schoolFilteredStudents = computed(() =>
  selectedSchoolId.value
    ? students.value.filter(student => student.schoolId === selectedSchoolId.value)
    : students.value,
)

const availableGrades = computed(() => collectUniqueGrades(schoolFilteredStudents.value))

const transactionsByStudentId = computed(() =>
  indexTransactionsByPersonId(transactions.value, 'studentId'),
)

const filteredStudents = computed(() =>
  schoolFilteredStudents.value.filter((student) => {
    if (!matchesSelectFilter(student.grade.trim(), selectedGrade.value)) {
      return false
    }

    const summary = financeStore.studentPaymentSummary(
      student,
      transactionsByStudentId.value.get(student.id) ?? [],
    )

    if (!matchesSelectFilter(summary.status, selectedStatus.value)) {
      return false
    }

    return matchesListSearch(searchQuery.value, [
      student.fullName,
      student.parentPhone,
      student.studentId,
    ])
  }),
)

const hasActiveFilters = computed(() =>
  searchQuery.value.trim().length > 0
  || selectedGrade.value !== ''
  || selectedStatus.value !== '',
)

const isSearchEmpty = computed(() =>
  hasActiveFilters.value
  && schoolFilteredStudents.value.length > 0
  && filteredStudents.value.length === 0,
)

watch(selectedSchoolId, () => {
  if (selectedGrade.value && !availableGrades.value.includes(selectedGrade.value)) {
    selectedGrade.value = ''
  }
})

async function loadTransactions() {
  isLoadingTransactions.value = true

  try {
    transactions.value = await financeStore.fetchStudentTransactionsForTerm()
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

function openStudent(student: Student) {
  selectedStudent.value = student
}

function closeModal() {
  selectedStudent.value = null
}

function onStudentUpdated(student: Student) {
  selectedStudent.value = student
}

function onStudentRemoved() {
  selectedStudent.value = null
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
            {{ $t('students.title') }}
          </h1>
          <p class="ui-page-subtitle">
            {{ $t('students.subtitle') }}
          </p>
        </div>
        <button
          type="button"
          class="ui-page-add-btn"
          :aria-label="$t('students.addButtonLabel')"
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
            :placeholder="$t('students.searchPlaceholder')"
          />
        </div>

        <!-- filter -->
        <label class="block max-w-md flex-1 space-y-1">
          <span class="ui-label">{{ $t('students.fields.school') }}</span>
          <select
            v-model="selectedSchoolId"
            class="ui-input"
          >
            <option value="">
              {{ $t('students.allSchools') }}
            </option>
            <option v-for="school in schools" :key="school.id" :value="school.id">
              {{ school.name }} — {{ school.branch }}
            </option>
          </select>
        </label>
        <label class="block max-w-md flex-1 space-y-1">
          <span class="ui-label">{{ $t('students.fields.grade') }}</span>
          <select
            v-model="selectedGrade"
            class="ui-input"
          >
            <option value="">
              {{ $t('students.allGrades') }}
            </option>
            <option v-for="grade in availableGrades" :key="grade" :value="grade">
              {{ grade }}
            </option>
          </select>
        </label>
        <label class="block max-w-md flex-1 space-y-1">
          <span class="ui-label">{{ $t('students.columns.status') }}</span>
          <select
            v-model="selectedStatus"
            class="ui-input"
          >
            <option value="">
              {{ $t('students.allStatuses') }}
            </option>
            <option v-for="status in PAYMENT_STATUSES" :key="status" :value="status">
              {{ $t(`students.status.${status}`) }}
            </option>
          </select>
        </label>
    
      </div>
    </section>

    <StudentList
      :students="filteredStudents"
      :transactions="transactions"
      :is-loading="isLoadingTransactions"
      :is-search-empty="isSearchEmpty"
      :search-query="searchQuery"
      @select="openStudent"
    />

    <LazyStudentAddModal
      v-if="showAddModal"
      :default-school-id="selectedSchoolId || undefined"
      @close="closeAddModal"
    />

    <LazyStudentDetailModal
      v-if="selectedStudent"
      :student="selectedStudent"
      @close="closeModal"
      @updated="onStudentUpdated"
      @removed="onStudentRemoved"
      @changed="loadTransactions"
    />
  </main>
</template>
