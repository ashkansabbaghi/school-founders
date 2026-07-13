<script setup lang="ts">
import { dismissFirstPaymentCta, shouldShowFirstPaymentCta } from '~/db/bootstrap'

const { t } = useI18n()
const localePath = useLocalePath()
const financeStore = useFinanceStore()

const visible = ref(false)

async function refresh() {
  visible.value = await shouldShowFirstPaymentCta()
}

async function dismiss() {
  await dismissFirstPaymentCta()
  visible.value = false
}

onMounted(() => {
  void refresh()
})

watch(() => financeStore.onboardingComplete, (complete) => {
  if (complete) {
    void refresh()
  }
})

defineExpose({ refresh })
</script>

<template>
  <div
    v-if="visible"
    class="flex flex-col gap-3 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"
    role="status"
  >
    <div>
      <p class="font-medium text-zinc-100">
        {{ t('onboarding.firstPaymentCta.title') }}
      </p>
      <p class="mt-1 text-sm text-zinc-400">
        {{ t('onboarding.firstPaymentCta.subtitle') }}
      </p>
    </div>
    <div class="flex shrink-0 flex-wrap items-center gap-2">
      <NuxtLink
        :to="localePath('/finance')"
        class="ui-btn-primary"
      >
        {{ t('onboarding.firstPaymentCta.action') }}
      </NuxtLink>
      <button
        type="button"
        class="ui-btn-secondary"
        @click="dismiss"
      >
        {{ t('onboarding.firstPaymentCta.dismiss') }}
      </button>
    </div>
  </div>
</template>
