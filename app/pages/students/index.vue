<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Student, StudentTransaction } from '#shared/types/financial'

const { t } = useI18n()
const financeStore = useFinanceStore()
const { schools, students, termYear, operatorName, isSubmitting, error, submitMessage } = storeToRefs(financeStore)

useHead({
  title: () => t('students.title'),
})

const selectedSchoolId = ref('')
const transactions = ref<StudentTransaction[]>([])
const isLoadingTransactions = ref(true)
const selectedStudent = ref<Student | null>(null)
const showAddForm = ref(false)

const addForm = reactive({
  fullName: '',
  nationalCode: '',
  studentId: '',
  grade: '',
  schoolId: '',
  fullPrice: '' as number | '',
  dynamicDiscountRate: 0.1,
  parentName: '',
  parentPhone: '',
})

const filteredStudents = computed(() =>
  selectedSchoolId.value
    ? students.value.filter(student => student.schoolId === selectedSchoolId.value)
    : students.value,
)

const canAddStudent = computed(() =>
  Boolean(
    addForm.fullName.trim()
    && addForm.nationalCode.trim()
    && addForm.studentId.trim()
    && addForm.grade.trim()
    && addForm.schoolId
    && addForm.fullPrice !== ''
    && Number(addForm.fullPrice) > 0
    && addForm.parentName.trim()
    && addForm.parentPhone.trim()
    && !isSubmitting.value,
  ),
)

async function loadTransactions() {
  isLoadingTransactions.value = true

  try {
    transactions.value = await $fetch<StudentTransaction[]>('/api/finance/student-transactions', {
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
  addForm.studentId = ''
  addForm.grade = ''
  addForm.schoolId = selectedSchoolId.value || (schools.value[0]?.id ?? '')
  addForm.fullPrice = ''
  addForm.dynamicDiscountRate = 0.1
  addForm.parentName = ''
  addForm.parentPhone = ''
}

async function submitAddStudent() {
  if (!canAddStudent.value) {
    return
  }

  financeStore.clearSubmitFeedback()

  try {
    await financeStore.saveStudent({
      fullName: addForm.fullName.trim(),
      nationalCode: addForm.nationalCode.trim(),
      studentId: addForm.studentId.trim(),
      grade: addForm.grade.trim(),
      schoolId: addForm.schoolId,
      fullPrice: Number(addForm.fullPrice),
      dynamicDiscountRate: addForm.dynamicDiscountRate,
      parentName: addForm.parentName.trim(),
      parentPhone: addForm.parentPhone.trim(),
    })

    resetAddForm()
    showAddForm.value = false
  }
  catch {
    // Error handled by store
  }
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

watch(selectedSchoolId, (schoolId) => {
  if (showAddForm.value && schoolId) {
    addForm.schoolId = schoolId
  }
})

watch(termYear, () => {
  void loadTransactions()
})

onMounted(async () => {
  if (financeStore.students.length === 0) {
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
    <header class="ui-page-header">
      <h1 class="ui-page-title">
        {{ $t('students.title') }}
      </h1>
      <p class="ui-page-subtitle">
        {{ $t('students.subtitle') }}
      </p>
    </header>

    <section class="ui-card p-6">
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
      </div>
    </section>

    <section class="ui-card p-6">
      <div class="mb-4 flex items-center justify-between gap-4">
        <h2 class="text-lg font-semibold text-zinc-100">
          {{ $t('students.addStudent') }}
        </h2>
        <button
          type="button"
          class="ui-btn-secondary"
          @click="showAddForm = !showAddForm"
        >
          {{ showAddForm ? $t('students.hideForm') : $t('students.showForm') }}
        </button>
      </div>

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

      <form
        v-if="showAddForm"
        class="grid gap-4 sm:grid-cols-2"
        @submit.prevent="submitAddStudent"
      >
        <label class="block space-y-1 sm:col-span-2">
          <span class="ui-label">{{ $t('students.fields.fullName') }}</span>
          <input
            v-model="addForm.fullName"
            type="text"
            required
            class="ui-input"
          >
        </label>
        <label class="block space-y-1">
          <span class="ui-label">{{ $t('students.fields.nationalCode') }}</span>
          <input
            v-model="addForm.nationalCode"
            type="text"
            required
            maxlength="10"
            class="ui-input"
          >
        </label>
        <label class="block space-y-1">
          <span class="ui-label">{{ $t('students.fields.studentId') }}</span>
          <input
            v-model="addForm.studentId"
            type="text"
            required
            class="ui-input"
          >
        </label>
        <label class="block space-y-1">
          <span class="ui-label">{{ $t('students.fields.grade') }}</span>
          <input
            v-model="addForm.grade"
            type="text"
            required
            class="ui-input"
          >
        </label>
        <label class="block space-y-1">
          <span class="ui-label">{{ $t('students.fields.school') }}</span>
          <select
            v-model="addForm.schoolId"
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
          <span class="ui-label">{{ $t('students.fields.fullPrice') }}</span>
          <input
            v-model.number="addForm.fullPrice"
            type="number"
            min="1"
            step="1"
            required
            class="ui-input"
          >
        </label>
        <label class="block space-y-1">
          <span class="ui-label">{{ $t('students.fields.discountRate') }}</span>
          <input
            v-model.number="addForm.dynamicDiscountRate"
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
            v-model="addForm.parentName"
            type="text"
            required
            class="ui-input"
          >
        </label>
        <label class="block space-y-1">
          <span class="ui-label">{{ $t('students.fields.parentPhone') }}</span>
          <input
            v-model="addForm.parentPhone"
            type="tel"
            required
            class="ui-input"
          >
        </label>
        <div class="sm:col-span-2">
          <button
            type="submit"
            :disabled="!canAddStudent"
            class="ui-btn-primary"
          >
            {{ isSubmitting ? $t('common.saving') : $t('students.addStudentButton') }}
          </button>
        </div>
      </form>
    </section>

    <StudentList
      :students="filteredStudents"
      :transactions="transactions"
      :is-loading="isLoadingTransactions"
      @select="openStudent"
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
