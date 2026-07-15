<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { RecentLogEntry } from '#shared/types/financial'
import { listRecentLogs } from '~/services/finance'
import { translateApiError } from '~/utils/translateApiError'

const { t } = useI18n()

useHead({
  title: () => t('home.title'),
})

const financeStore = useFinanceStore()
const { termYear, status, error } = storeToRefs(financeStore)

const recentLogs = ref<RecentLogEntry[]>([])
const recentLogsStatus = ref<'idle' | 'loading' | 'error'>('idle')
const recentLogsError = ref<string | null>(null)

async function refreshRecentLogs() {
  recentLogsStatus.value = 'loading'
  recentLogsError.value = null

  try {
    recentLogs.value = await listRecentLogs({
      termYear: termYear.value,
      limit: 10,
    })
    recentLogsStatus.value = 'idle'
  }
  catch (loadError) {
    recentLogsStatus.value = 'error'
    recentLogsError.value = translateApiError(loadError, t)
  }
}

watch(termYear, () => {
  void refreshRecentLogs()
})

onMounted(async () => {
  await financeStore.ensureReady()
  await refreshRecentLogs()
})
</script>

<template>
  <main class="mx-auto max-w-6xl space-y-8 p-4 sm:p-6">
    <header class="ui-page-header">
      <div>
        <h1 class="ui-page-title">
          {{ $t('home.title') }}
        </h1>
        <p class="ui-page-subtitle">
          {{ $t('home.subtitle') }}
        </p>
      </div>
    </header>

    <div
      v-if="status === 'error' && error"
      class="ui-alert-error"
      role="alert"
    >
      {{ error }}
    </div>
    <div
      v-if="recentLogsError"
      class="ui-alert-error"
      role="alert"
    >
      {{ recentLogsError }}
    </div>

    <FirstPaymentCta />

    <DashboardStats />
    <FoundersReportTable />
    <RecentActivityLog
      :logs="recentLogs"
      :pending="recentLogsStatus === 'loading' && !recentLogs.length"
    />
  </main>
</template>
