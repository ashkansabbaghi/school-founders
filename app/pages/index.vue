<script setup lang="ts">
import { storeToRefs } from 'pinia'

const { t } = useI18n()

useHead({
  title: () => t('home.title'),
})

const financeStore = useFinanceStore()
const { termYear } = storeToRefs(financeStore)

const { data: recentLogs, status: recentLogsStatus, refresh: refreshRecentLogs } = useFetch(
  '/api/finance/recent-logs',
  {
    query: computed(() => ({
      termYear: termYear.value,
      limit: 10,
    })),
    default: () => [],
  },
)

watch(termYear, () => {
  void refreshRecentLogs()
})

function onTermYearInput(event: Event) {
  financeStore.setTermYear((event.target as HTMLInputElement).value)
}

onMounted(() => {
  void financeStore.init()
})
</script>

<template>
  <main class="mx-auto max-w-6xl space-y-8 p-4 sm:p-6">
    <header class="ui-page-header">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="ui-page-title">
            {{ $t('home.title') }}
          </h1>
          <p class="ui-page-subtitle">
            {{ $t('home.subtitle') }}
          </p>
        </div>
        <label class="block w-full max-w-xs space-y-1">
          <span class="ui-label">{{ $t('operator.fields.termYear') }}</span>
          <input
            :value="termYear"
            type="text"
            class="ui-input"
            :placeholder="$t('operator.placeholders.termYear')"
            @input="onTermYearInput"
          >
        </label>
      </div>
    </header>

    <DashboardStats />
    <FoundersReportTable />
    <RecentActivityLog
      :logs="recentLogs ?? []"
      :pending="recentLogsStatus === 'pending' && !(recentLogs?.length)"
    />
  </main>
</template>
