<script setup lang="ts">
import { completeOnboarding } from '~/db/bootstrap'
import { translateApiError } from '~/utils/translateApiError'

const { t } = useI18n()
const financeStore = useFinanceStore()

const step = ref(1)
const isSubmitting = ref(false)
const error = ref('')

const form = reactive({
  operatorName: '',
  termYear: '1404-1405',
  startWithDemo: true as boolean | null,
})

const canProceedStep2 = computed(() =>
  Boolean(form.operatorName.trim() && form.termYear.trim()),
)

const canFinish = computed(() =>
  form.startWithDemo !== null && !isSubmitting.value,
)

function nextStep() {
  error.value = ''
  step.value += 1
}

function previousStep() {
  error.value = ''
  step.value -= 1
}

function selectDataOption(startWithDemo: boolean) {
  form.startWithDemo = startWithDemo
}

async function finish() {
  if (!canFinish.value || form.startWithDemo === null) {
    return
  }

  error.value = ''
  isSubmitting.value = true

  try {
    await completeOnboarding({
      operatorName: form.operatorName.trim(),
      termYear: form.termYear.trim(),
      startWithDemo: form.startWithDemo,
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
    class="fixed inset-0 z-[100] flex items-stretch justify-center overflow-y-auto bg-zinc-950/95 backdrop-blur-sm sm:items-center sm:p-4"
    role="presentation"
  >
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="t('onboarding.title')"
      class="flex min-h-dvh w-full max-w-lg flex-col bg-zinc-900 shadow-xl sm:min-h-0 sm:rounded-xl sm:border sm:border-zinc-800"
    >
      <header class="border-b border-zinc-800 px-4 py-5 sm:px-6">
        <p class="text-xs font-medium uppercase tracking-wide text-violet-400">
          {{ t('onboarding.stepIndicator', { current: step, total: 3 }) }}
        </p>
        <h1 class="mt-1 text-xl font-bold text-zinc-100">
          {{ t(`onboarding.steps.${step}.title`) }}
        </h1>
        <p class="mt-2 text-sm text-zinc-400">
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
          <ul class="space-y-3 text-sm text-zinc-300">
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
          v-else-if="step === 2"
          class="space-y-4"
          @submit.prevent="canProceedStep2 && nextStep()"
        >
          <div>
            <label class="ui-label" for="onboarding-operator-name">
              {{ t('operator.fields.operatorName') }}
            </label>
            <input
              id="onboarding-operator-name"
              v-model="form.operatorName"
              type="text"
              class="ui-input mt-1.5"
              :placeholder="t('operator.placeholders.operatorName')"
              autocomplete="name"
              required
            >
            <p class="mt-1.5 text-xs text-zinc-500">
              {{ t('onboarding.steps.2.operatorHint') }}
            </p>
          </div>

          <div>
            <label class="ui-label" for="onboarding-term-year">
              {{ t('operator.fields.termYear') }}
            </label>
            <input
              id="onboarding-term-year"
              v-model="form.termYear"
              type="text"
              class="ui-input mt-1.5"
              :placeholder="t('operator.placeholders.termYear')"
              required
            >
            <p class="mt-1.5 text-xs text-zinc-500">
              {{ t('onboarding.steps.2.termYearHint') }}
            </p>
          </div>
        </form>

        <div v-else class="space-y-3">
          <button
            type="button"
            class="w-full rounded-xl border p-4 text-start transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
            :class="form.startWithDemo === true
              ? 'border-violet-500/60 bg-violet-500/10'
              : 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-600'"
            @click="selectDataOption(true)"
          >
            <p class="font-medium text-zinc-100">
              {{ t('onboarding.steps.3.demo.title') }}
            </p>
            <p class="mt-1 text-sm text-zinc-400">
              {{ t('onboarding.steps.3.demo.description') }}
            </p>
          </button>

          <button
            type="button"
            class="w-full rounded-xl border p-4 text-start transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
            :class="form.startWithDemo === false
              ? 'border-violet-500/60 bg-violet-500/10'
              : 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-600'"
            @click="selectDataOption(false)"
          >
            <p class="font-medium text-zinc-100">
              {{ t('onboarding.steps.3.empty.title') }}
            </p>
            <p class="mt-1 text-sm text-zinc-400">
              {{ t('onboarding.steps.3.empty.description') }}
            </p>
          </button>
        </div>
      </div>

      <footer class="flex items-center justify-between gap-3 border-t border-zinc-800 px-4 py-4 sm:px-6">
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
          v-if="step < 3"
          type="button"
          class="ui-btn-primary"
          :disabled="step === 2 && !canProceedStep2"
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
