<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Student, StudentTransaction } from '#shared/types/financial'

const { t } = useI18n()
const financeStore = useFinanceStore()
const { schools, students, termYear, error, submitMessage } = storeToRefs(financeStore)

useHead({
  title: () => t('students.title'),
})

const selectedSchoolId = ref('')
const transactions = ref<StudentTransaction[]>([])
const isLoadingTransactions = ref(true)
const selectedStudent = ref<Student | null>(null)
const showAddModal = ref(false)

const filteredStudents = computed(() =>
  selectedSchoolId.value
    ? students.value.filter(student => student.schoolId === selectedSchoolId.value)
    : students.value,
)

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
      <label class="block max-w-md space-y-1">
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
    </section>

    <StudentList
      :students="filteredStudents"
      :transactions="transactions"
      :is-loading="isLoadingTransactions"
      @select="openStudent"
    />

    <StudentAddModal
      v-if="showAddModal"
      :default-school-id="selectedSchoolId || undefined"
      @close="closeAddModal"
    />

    <StudentDetailModal
      v-if="selectedStudent"
      :student="selectedStudent"
      @close="closeModal"
      @updated="onStudentUpdated"
      @removed="onStudentRemoved"
      @changed="loadTransactions"
    />
  </main>
</template>
