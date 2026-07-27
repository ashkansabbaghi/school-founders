<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Student } from '#shared/types/financial'
import {
  formatClassLabel,
  normalizeSchoolClasses,
} from '#shared/utils/schoolClass'

const props = defineProps<{
  defaultSchoolId?: string
}>()

const emit = defineEmits<{
  close: []
  created: [student: Student]
}>()

const financeStore = useFinanceStore()
const { schools, isSubmitting, submitError } = storeToRefs(financeStore)

const gradeOptions = ['7', '8', '9', '10', '11', '12']

const form = reactive({
  fullName: '',
  nationalCode: '',
  studentId: '',
  grade: '',
  classId: '',
  schoolId: '',
  fullPrice: '' as number | '',
  dynamicDiscountRatePercent: '' as number | '',
  parentName: '',
  parentPhone: '',
})

const selectedSchool = computed(() =>
  schools.value.find(school => school.id === form.schoolId),
)

const availableClasses = computed(() => {
  if (!form.schoolId || !form.grade) {
    return []
  }

  return normalizeSchoolClasses(selectedSchool.value?.classes)
    .filter(schoolClass => schoolClass.grade === form.grade)
    .sort((a, b) => a.classNumber - b.classNumber)
})

const showNoClassesHint = computed(() =>
  Boolean(form.schoolId && form.grade && availableClasses.value.length === 0),
)

const canSubmit = computed(() =>
  Boolean(
    form.fullName.trim()
    && form.nationalCode.trim()
    && form.studentId.trim()
    && form.grade
    && form.classId
    && form.schoolId
    && form.fullPrice !== ''
    && Number(form.fullPrice) > 0
    && form.parentName.trim()
    && form.parentPhone.trim()
    && availableClasses.value.some(schoolClass => schoolClass.id === form.classId)
    && !isSubmitting.value,
  ),
)

function classOptionLabel(grade: string, classNumber: number) {
  return formatClassLabel(grade, classNumber)
}

function defaultSchoolIdValue(): string {
  return props.defaultSchoolId || schools.value[0]?.id || ''
}

function resetForm() {
  form.fullName = ''
  form.nationalCode = ''
  form.studentId = ''
  form.grade = ''
  form.classId = ''
  form.schoolId = defaultSchoolIdValue()
  form.fullPrice = ''
  form.dynamicDiscountRatePercent = ''
  form.parentName = ''
  form.parentPhone = ''
}

async function submit() {
  if (!canSubmit.value) {
    return
  }

  financeStore.clearSubmitFeedback()

  try {
    const student = await financeStore.saveStudent({
      fullName: form.fullName.trim(),
      nationalCode: form.nationalCode.trim(),
      studentId: form.studentId.trim(),
      grade: form.grade.trim(),
      classId: form.classId,
      schoolId: form.schoolId,
      fullPrice: Number(form.fullPrice),
      dynamicDiscountRate: (Number(form.dynamicDiscountRatePercent) || 0) / 100,
      parentName: form.parentName.trim(),
      parentPhone: form.parentPhone.trim(),
    })

    if (student) {
      resetForm()
      emit('created', student)
      emit('close')
    }
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
  () => props.defaultSchoolId,
  (schoolId) => {
    if (schoolId) {
      form.schoolId = schoolId
    }
  },
)

watch(
  [() => form.schoolId, () => form.grade],
  () => {
    if (!availableClasses.value.some(schoolClass => schoolClass.id === form.classId)) {
      form.classId = ''
    }
  },
)

onMounted(() => {
  resetForm()
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
      :aria-label="$t('students.addStudent')"
      class="ui-modal-panel max-w-3xl sm:my-8"
    >
      <header class="ui-modal-header">
        <h2 class="text-lg font-semibold">
          {{ $t('students.addStudent') }}
        </h2>
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
        <div
          v-if="submitError"
          class="ui-alert-error mb-4"
          role="alert"
        >
          {{ submitError }}
        </div>
        <form
          class="grid gap-4 sm:grid-cols-2"
          @submit.prevent="submit"
        >
          <label class="block space-y-1 sm:col-span-2">
            <span class="ui-label">{{ $t('students.fields.fullName') }}</span>
            <input
              v-model="form.fullName"
              type="text"
              required
              class="ui-input"
              :placeholder="$t('students.placeholders.fullName')"
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
              :placeholder="$t('students.placeholders.nationalCode')"
            >
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('students.fields.studentId') }}</span>
            <input
              v-model="form.studentId"
              type="text"
              required
              class="ui-input"
              :placeholder="$t('students.placeholders.studentId')"
            >
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('students.fields.school') }}</span>
            <select
              v-model="form.schoolId"
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
            <span class="ui-label">{{ $t('students.fields.grade') }}</span>
            <select
              v-model="form.grade"
              required
              class="ui-input"
            >
              <option value="" disabled>
                {{ $t('students.selectGrade') }}
              </option>
              <option v-for="grade in gradeOptions" :key="grade" :value="grade">
                {{ grade }}
              </option>
            </select>
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('students.fields.class') }}</span>
            <select
              v-model="form.classId"
              required
              class="ui-input"
              :disabled="availableClasses.length === 0"
            >
              <option value="" disabled>
                {{ $t('students.selectClass') }}
              </option>
              <option
                v-for="schoolClass in availableClasses"
                :key="schoolClass.id"
                :value="schoolClass.id"
              >
                {{ classOptionLabel(schoolClass.grade, schoolClass.classNumber) }}
              </option>
            </select>
            <p
              v-if="showNoClassesHint"
              class="text-sm text-amber-600 dark:text-amber-400"
            >
              {{ $t('students.noClassesForGrade') }}
            </p>
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('students.fields.fullPrice') }}</span>
            <CurrencyField
              v-model="form.fullPrice"
              required
              :placeholder="$t('students.placeholders.fullPrice')"
            />
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('students.fields.discountRatePercent') }}</span>
            <input
              v-model.number="form.dynamicDiscountRatePercent"
              type="number"
              min="0"
              max="100"
              step="1"
              class="ui-input"
              :placeholder="$t('students.placeholders.discountRatePercent')"
            >
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('students.fields.parentName') }}</span>
            <input
              v-model="form.parentName"
              type="text"
              required
              class="ui-input"
              :placeholder="$t('students.placeholders.parentName')"
            >
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('students.fields.parentPhone') }}</span>
            <input
              v-model="form.parentPhone"
              type="tel"
              required
              class="ui-input"
              :placeholder="$t('students.placeholders.parentPhone')"
            >
          </label>
          <div class="sm:col-span-2">
            <button
              type="submit"
              :disabled="!canSubmit"
              class="ui-btn-primary"
            >
              {{ isSubmitting ? $t('common.saving') : $t('students.addStudentButton') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
