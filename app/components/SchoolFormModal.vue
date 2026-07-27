<script setup lang="ts">
import type { School, SchoolClass } from '#shared/types/financial'
import {
  formatClassLabel,
  hasDuplicateClassNumber,
  nextClassNumber,
  normalizeSchoolClasses,
} from '#shared/utils/schoolClass'

const props = defineProps<{
  school?: School | null
}>()

const emit = defineEmits<{
  close: []
  saved: [school: School]
}>()

const { t } = useI18n()
const { createSchool, updateSchool } = useSchools()

const gradeOptions = ['7', '8', '9', '10', '11', '12']

const isEditing = computed(() => Boolean(props.school))

const form = reactive({
  name: '',
  branch: '',
  classes: [] as SchoolClass[],
})

const newClassGrade = ref('')
const editingClassId = ref<string | null>(null)
const editingClassNumber = ref<number | ''>('')
const classFormError = ref<string | null>(null)
const isSubmitting = ref(false)

const sortedClasses = computed(() =>
  [...form.classes].sort((a, b) => {
    const gradeCmp = a.grade.localeCompare(b.grade, undefined, { numeric: true })
    if (gradeCmp !== 0) {
      return gradeCmp
    }
    return a.classNumber - b.classNumber
  }),
)

const previewClassNumber = computed(() => {
  if (!newClassGrade.value) {
    return null
  }
  return nextClassNumber(form.classes, newClassGrade.value)
})

const canAddClass = computed(() => Boolean(newClassGrade.value) && !isSubmitting.value)

const canSubmit = computed(() =>
  Boolean(form.name.trim() && form.branch.trim() && !isSubmitting.value),
)

function clearClassFormError() {
  classFormError.value = null
}

function resetClassEditors() {
  newClassGrade.value = ''
  editingClassId.value = null
  editingClassNumber.value = ''
  clearClassFormError()
}

function resetForm() {
  form.name = props.school?.name ?? ''
  form.branch = props.school?.branch ?? ''
  form.classes = normalizeSchoolClasses(props.school?.classes).map(schoolClass => ({
    ...schoolClass,
  }))
  resetClassEditors()
}

function addClass() {
  if (!canAddClass.value) {
    return
  }

  const grade = newClassGrade.value
  const classNumber = nextClassNumber(form.classes, grade)

  form.classes.push({
    id: crypto.randomUUID(),
    grade,
    classNumber,
  })
  newClassGrade.value = ''
  clearClassFormError()
}

function startEditClass(schoolClass: SchoolClass) {
  editingClassId.value = schoolClass.id
  editingClassNumber.value = schoolClass.classNumber
  clearClassFormError()
}

function cancelEditClass() {
  editingClassId.value = null
  editingClassNumber.value = ''
  clearClassFormError()
}

function saveEditClass() {
  if (!editingClassId.value || editingClassNumber.value === '') {
    return
  }

  const classNumber = Number(editingClassNumber.value)
  if (!Number.isInteger(classNumber) || classNumber < 1) {
    return
  }

  const existing = form.classes.find(schoolClass => schoolClass.id === editingClassId.value)
  if (!existing) {
    return
  }

  if (hasDuplicateClassNumber(form.classes, existing.grade, classNumber, editingClassId.value)) {
    classFormError.value = t('schools.duplicateClassNumber', {
      label: formatClassLabel(existing.grade, classNumber),
    })
    return
  }

  existing.classNumber = classNumber
  cancelEditClass()
}

function classLabel(schoolClass: SchoolClass) {
  return formatClassLabel(schoolClass.grade, schoolClass.classNumber)
}

async function submit() {
  if (!canSubmit.value) {
    return
  }

  isSubmitting.value = true

  try {
    const payload = {
      name: form.name.trim(),
      branch: form.branch.trim(),
      classes: form.classes.map(schoolClass => ({ ...schoolClass })),
    }

    const school = isEditing.value && props.school
      ? await updateSchool(props.school.id, payload)
      : await createSchool(payload)

    resetForm()
    emit('saved', school)
    emit('close')
  }
  catch {
    // Error handled by composable
  }
  finally {
    isSubmitting.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

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
      :aria-label="isEditing ? $t('schools.editTitle') : $t('schools.addTitle')"
      class="ui-modal-panel max-w-xl sm:my-8"
    >
      <header class="ui-modal-header">
        <h2 class="text-lg font-semibold">
          {{ isEditing ? $t('schools.editTitle') : $t('schools.addTitle') }}
        </h2>
        <button
          type="button"
          class="ui-modal-close"
          :aria-label="$t('employees.close')"
          @click="emit('close')"
        >
          ✕
        </button>
      </header>

      <div class="scrollbar-thin px-4 py-5 sm:max-h-[calc(100vh-8rem)] sm:overflow-y-auto sm:px-6">
        <form
          class="grid gap-4 sm:grid-cols-2"
          @submit.prevent="submit"
        >
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('fields.name') }}</span>
            <input
              v-model="form.name"
              type="text"
              required
              class="ui-input"
            >
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('fields.branch') }}</span>
            <input
              v-model="form.branch"
              type="text"
              required
              class="ui-input"
            >
          </label>

          <section class="space-y-3 sm:col-span-2">
            <h3 class="text-sm font-semibold">
              {{ $t('schools.classesTitle') }}
            </h3>

            <div
              v-if="sortedClasses.length"
              class="space-y-2"
            >
              <div
                v-for="schoolClass in sortedClasses"
                :key="schoolClass.id"
                class="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                <template v-if="editingClassId === schoolClass.id">
                  <span class="text-sm ui-text-muted">
                    {{ schoolClass.grade }}-
                  </span>
                  <input
                    v-model.number="editingClassNumber"
                    type="number"
                    min="1"
                    step="1"
                    required
                    class="ui-input w-20"
                    :aria-label="$t('fields.classNumber')"
                    @keydown.enter.prevent="saveEditClass"
                  >
                  <button
                    type="button"
                    class="ui-btn-primary px-3 py-1.5"
                    @click="saveEditClass"
                  >
                    {{ $t('schools.saveClass') }}
                  </button>
                  <button
                    type="button"
                    class="ui-btn-secondary px-3 py-1.5"
                    @click="cancelEditClass"
                  >
                    {{ $t('schools.cancelEditClass') }}
                  </button>
                </template>
                <template v-else>
                  <span class="min-w-0 flex-1 font-medium tabular-nums">
                    {{ classLabel(schoolClass) }}
                  </span>
                  <button
                    type="button"
                    class="ui-btn-secondary px-3 py-1.5"
                    :aria-label="$t('schools.editClass')"
                    @click="startEditClass(schoolClass)"
                  >
                    {{ $t('common.edit') }}
                  </button>
                </template>
              </div>
            </div>
            <p
              v-else
              class="text-sm ui-text-muted"
            >
              {{ $t('schools.classesEmpty') }}
            </p>

            <div
              v-if="classFormError"
              class="ui-alert-error text-sm"
              role="alert"
            >
              {{ classFormError }}
            </div>

            <div class="flex flex-wrap items-end gap-3">
              <label class="block min-w-[8rem] flex-1 space-y-1">
                <span class="ui-label">{{ $t('fields.grade') }}</span>
                <select
                  v-model="newClassGrade"
                  class="ui-input"
                >
                  <option value="">
                    {{ $t('schools.selectGrade') }}
                  </option>
                  <option
                    v-for="grade in gradeOptions"
                    :key="grade"
                    :value="grade"
                  >
                    {{ grade }}
                  </option>
                </select>
              </label>
              <p
                v-if="previewClassNumber !== null"
                class="pb-2 text-sm ui-text-muted tabular-nums"
              >
                {{ $t('schools.nextClassNumber', { number: previewClassNumber }) }}
              </p>
              <button
                type="button"
                class="ui-btn-secondary"
                :disabled="!canAddClass"
                @click="addClass"
              >
                {{ $t('schools.addClass') }}
              </button>
            </div>
          </section>

          <div class="sm:col-span-2">
            <button
              type="submit"
              :disabled="!canSubmit"
              class="ui-btn-primary"
            >
              {{ isSubmitting ? $t('common.saving') : (isEditing ? $t('common.save') : $t('schools.addTitle')) }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
