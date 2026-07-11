<script setup lang="ts">
const { t } = useI18n()
const { isOnline } = useNetworkStatus()
</script>

<template>
  <div
    v-if="!isOnline"
    class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300"
    role="status"
    :aria-label="t('pwa.offline.status')"
  >
    <span class="size-1.5 rounded-full bg-amber-400" aria-hidden="true" />
    {{ t('pwa.offline.status') }}
  </div>
</template>
