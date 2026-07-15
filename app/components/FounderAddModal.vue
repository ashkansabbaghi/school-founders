<script setup lang="ts">
import type { Founder } from '#shared/types/founder'

const emit = defineEmits<{
  close: []
  created: [founder: Founder]
}>()

const { createFounder } = useFounders()
const financeStore = useFinanceStore()

const schoolOptions = computed(() => financeStore.schools)

const form = reactive({
  name: '',
  school: '',
})

const isSubmitting = ref(false)

const canSubmit = computed(() =>
  Boolean(form.name.trim() && !isSubmitting.value),
)

function resetForm() {
  form.name = ''
  form.school = ''
}

async function submit() {
  if (!canSubmit.value) {
    return
  }

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

onMounted(async () => {
  resetForm()
  document.addEventListener('keydown', onKeydown)
  await financeStore.ensureReady()
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
      <header class="ui-modal-header">
        <h2 class="text-lg font-semibold">
          {{ $t('home.addFounder') }}
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
            <span class="ui-label">{{ $t('home.name') }}</span>
            <input
              v-model="form.name"
              type="text"
              required
              class="ui-input"
            >
          </label>
          <label class="block space-y-1 sm:col-span-2">
            <span class="ui-label">{{ $t('home.school') }}</span>
            <select
              v-if="schoolOptions.length"
              v-model="form.school"
              class="ui-input"
            >
              <option value="">
                {{ $t('schools.selectOptional') }}
              </option>
              <option
                v-for="school in schoolOptions"
                :key="school.id"
                :value="school.name"
              >
                {{ school.name }} — {{ school.branch }}
              </option>
            </select>
            <input
              v-else
              v-model="form.school"
              type="text"
              class="ui-input"
              :placeholder="$t('schools.namePlaceholder')"
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
