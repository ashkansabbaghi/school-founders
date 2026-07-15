<script setup lang="ts">
import type { School } from '#shared/types/financial'
import { translateApiError } from '~/utils/translateApiError'

const props = defineProps<{
  school?: School | null
}>()

const emit = defineEmits<{
  close: []
  saved: [school: School]
}>()

const { t } = useI18n()
const { createSchool, updateSchool } = useSchools()

const isEditing = computed(() => Boolean(props.school))

const form = reactive({
  name: '',
  branch: '',
})

const isSubmitting = ref(false)
const error = ref('')

const canSubmit = computed(() =>
  Boolean(form.name.trim() && form.branch.trim() && !isSubmitting.value),
)

function resetForm() {
  form.name = props.school?.name ?? ''
  form.branch = props.school?.branch ?? ''
  error.value = ''
}

async function submit() {
  if (!canSubmit.value) {
    return
  }

  error.value = ''
  isSubmitting.value = true

  try {
    const payload = {
      name: form.name.trim(),
      branch: form.branch.trim(),
    }

    const school = isEditing.value && props.school
      ? await updateSchool(props.school.id, payload)
      : await createSchool(payload)

    resetForm()
    emit('saved', school)
    emit('close')
  }
  catch (err) {
    error.value = translateApiError(err, t)
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
