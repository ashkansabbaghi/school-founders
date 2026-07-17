<script setup lang="ts">
import { completeOnboarding } from '~/db/bootstrap'
import { translateApiError } from '~/utils/translateApiError'

const { t } = useI18n()
const financeStore = useFinanceStore()

const step = ref(1)
const isSubmitting = ref(false)
const error = ref('')

const form = reactive({
  userName: '',
  termYear: '1404-1405',
})

const canProceedStep2 = computed(() =>
  Boolean(form.userName.trim() && form.termYear.trim()),
)

const canFinish = computed(() =>
  canProceedStep2.value && !isSubmitting.value,
)

function nextStep() {
  error.value = ''
  step.value += 1
}

function previousStep() {
  error.value = ''
  step.value -= 1
}

async function finish() {
  if (!canFinish.value) {
    return
  }

  error.value = ''
  isSubmitting.value = true

  try {
    await completeOnboarding({
      userName: form.userName.trim(),
      termYear: form.termYear.trim(),
    })

    financeStore.setOnboardingComplete(true)
    await financeStore.reload()
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
    event.preventDefault()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    class="ui-modal-overlay z-[100]"
    role="presentation"
  >
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="t('onboarding.title')"
      class="ui-modal-panel flex min-h-dvh w-full max-w-lg flex-col sm:min-h-0 sm:max-w-lg"
    >
      <header class="ui-card-header py-5">
        <p class="text-xs font-medium uppercase tracking-wide text-violet-400">
          {{ t('onboarding.stepIndicator', { current: step, total: 2 }) }}
        </p>
        <h1 class="mt-1 text-xl font-bold">
          {{ t(`onboarding.steps.${step}.title`) }}
        </h1>
        <p class="mt-2 text-sm ui-text-muted">
          {{ t(`onboarding.steps.${step}.subtitle`) }}
        </p>
      </header>

      <div class="flex-1 px-4 py-5 sm:px-6">
        <div
          v-if="error"
          class="ui-alert-error mb-4"
          role="alert"
        >
          {{ error }}
        </div>

        <div v-if="step === 1" class="space-y-4">
          <ul class="space-y-3 text-sm ui-text-secondary">
            <li class="flex gap-3">
              <span class="mt-0.5 text-violet-400" aria-hidden="true">✓</span>
              <span>{{ t('onboarding.steps.1.points.offline') }}</span>
            </li>
            <li class="flex gap-3">
              <span class="mt-0.5 text-violet-400" aria-hidden="true">✓</span>
              <span>{{ t('onboarding.steps.1.points.local') }}</span>
            </li>
            <li class="flex gap-3">
              <span class="mt-0.5 text-violet-400" aria-hidden="true">✓</span>
              <span>{{ t('onboarding.steps.1.points.backup') }}</span>
            </li>
          </ul>
        </div>

        <form
          v-else
          class="space-y-4"
          @submit.prevent="finish"
        >
          <div>
            <label class="ui-label" for="onboarding-user-name">
              {{ t('profile.userName') }}
            </label>
            <input
              id="onboarding-user-name"
              v-model="form.userName"
              type="text"
              class="ui-input mt-1.5"
              :placeholder="t('profile.userNamePlaceholder')"
              autocomplete="name"
              required
            >
            <p class="mt-1.5 text-xs text-zinc-500">
              {{ t('onboarding.steps.2.userNameHint') }}
            </p>
          </div>

          <div>
            <label class="ui-label" for="onboarding-term-year">
              {{ t('academicYear.label') }}
            </label>
            <AcademicYearField
              id="onboarding-term-year"
              v-model="form.termYear"
              class="mt-1.5"
              required
            />
            <p class="mt-1.5 text-xs text-zinc-500">
              {{ t('onboarding.steps.2.termYearHint') }}
            </p>
          </div>
        </form>
      </div>

      <footer class="ui-divider-t-only flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <button
          v-if="step > 1"
          type="button"
          class="ui-btn-secondary"
          :disabled="isSubmitting"
          @click="previousStep"
        >
          {{ t('onboarding.actions.back') }}
        </button>
        <span v-else />

        <button
          v-if="step < 2"
          type="button"
          class="ui-btn-primary"
          @click="nextStep"
        >
          {{ t('onboarding.actions.next') }}
        </button>
        <button
          v-else
          type="button"
          class="ui-btn-primary"
          :disabled="!canFinish"
          @click="finish"
        >
          {{ isSubmitting ? t('common.saving') : t('onboarding.actions.start') }}
        </button>
      </footer>
    </div>
  </div>
</template>
