<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Student } from '#shared/types/financial'

const props = defineProps<{
  defaultSchoolId?: string
}>()

const emit = defineEmits<{
  close: []
  created: [student: Student]
}>()

const financeStore = useFinanceStore()
const { schools, isSubmitting, error, submitMessage } = storeToRefs(financeStore)

const form = reactive({
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

const canSubmit = computed(() =>
  Boolean(
    form.fullName.trim()
    && form.nationalCode.trim()
    && form.studentId.trim()
    && form.grade.trim()
    && form.schoolId
    && form.fullPrice !== ''
    && Number(form.fullPrice) > 0
    && form.parentName.trim()
    && form.parentPhone.trim()
    && !isSubmitting.value,
  ),
)

function defaultSchoolIdValue(): string {
  return props.defaultSchoolId || schools.value[0]?.id || ''
}

function resetForm() {
  form.fullName = ''
  form.nationalCode = ''
  form.studentId = ''
  form.grade = ''
  form.schoolId = defaultSchoolIdValue()
  form.fullPrice = ''
  form.dynamicDiscountRate = 0.1
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
      schoolId: form.schoolId,
      fullPrice: Number(form.fullPrice),
      dynamicDiscountRate: form.dynamicDiscountRate,
      parentName: form.parentName.trim(),
      parentPhone: form.parentPhone.trim(),
    })

    resetForm()
    emit('created', student)
    emit('close')
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
      <header class="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-zinc-800 bg-zinc-900/95 px-4 py-4 backdrop-blur sm:static sm:rounded-t-xl sm:px-6">
        <h2 class="text-lg font-semibold text-zinc-100">
          {{ $t('students.addStudent') }}
        </h2>
        <button
          type="button"
          class="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg p-2 text-zinc-400 transition-colors duration-200 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
          :aria-label="$t('students.close')"
          @click="emit('close')"
        >
          ✕
        </button>
      </header>

      <div class="scrollbar-thin px-4 py-5 sm:max-h-[calc(100vh-8rem)] sm:overflow-y-auto sm:px-6">
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
            >
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('students.fields.studentId') }}</span>
            <input
              v-model="form.studentId"
              type="text"
              required
              class="ui-input"
            >
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('students.fields.grade') }}</span>
            <input
              v-model="form.grade"
              type="text"
              required
              class="ui-input"
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
            <span class="ui-label">{{ $t('students.fields.fullPrice') }}</span>
            <CurrencyField
              v-model="form.fullPrice"
              required
            />
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('students.fields.discountRate') }}</span>
            <input
              v-model.number="form.dynamicDiscountRate"
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
              v-model="form.parentName"
              type="text"
              required
              class="ui-input"
            >
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('students.fields.parentPhone') }}</span>
            <input
              v-model="form.parentPhone"
              type="tel"
              required
              class="ui-input"
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
