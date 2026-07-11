<script setup lang="ts">
import type { Founder } from '~/composables/useFounders'
import { translateApiError } from '~/utils/translateApiError'

const emit = defineEmits<{
  close: []
  created: [founder: Founder]
}>()

const { t } = useI18n()
const { createFounder } = useFounders()

const form = reactive({
  name: '',
  school: '',
})

const isSubmitting = ref(false)
const error = ref('')

const canSubmit = computed(() =>
  Boolean(form.name.trim() && !isSubmitting.value),
)

function resetForm() {
  form.name = ''
  form.school = ''
  error.value = ''
}

async function submit() {
  if (!canSubmit.value) {
    return
  }

  error.value = ''
  isSubmitting.value = true

  try {
    const founder = await createFounder({
      name: form.name.trim(),
      school: form.school.trim() || undefined,
    })

    resetForm()
    emit('created', founder)
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
      :aria-label="$t('home.addFounder')"
      class="ui-modal-panel max-w-xl sm:my-8"
    >
      <header class="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-zinc-800 bg-zinc-900/95 px-4 py-4 backdrop-blur sm:static sm:rounded-t-xl sm:px-6">
        <h2 class="text-lg font-semibold text-zinc-100">
          {{ $t('home.addFounder') }}
        </h2>
        <button
          type="button"
          class="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg p-2 text-zinc-400 transition-colors duration-200 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
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
            <span class="ui-label">{{ $t('home.name') }}</span>
            <input
              v-model="form.name"
              type="text"
              required
              class="ui-input"
            >
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('home.school') }}</span>
            <input
              v-model="form.school"
              type="text"
              class="ui-input"
            >
          </label>
          <div class="sm:col-span-2">
            <button
              type="submit"
              :disabled="!canSubmit"
              class="ui-btn-primary"
            >
              {{ isSubmitting ? $t('common.saving') : $t('home.addFounder') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
