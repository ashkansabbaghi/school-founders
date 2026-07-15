<script setup lang="ts">
const { t } = useI18n()
const { $pwa } = useNuxtApp()

const visible = computed(() => Boolean($pwa?.needRefresh))

async function reloadApp() {
  await $pwa?.updateServiceWorker(true)
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-lg items-center justify-between gap-3 rounded-xl border border-violet-500/30 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md dark:bg-zinc-900/95 md:bottom-6"
    role="status"
  >
    <p class="text-sm ui-text-secondary">
      {{ t('pwa.update.message') }}
    </p>
    <button
      type="button"
      class="ui-btn-primary shrink-0"
      @click="reloadApp"
    >
      {{ t('pwa.update.reload') }}
    </button>
  </div>
</template>
