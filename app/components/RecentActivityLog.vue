<script setup lang="ts">
import type { RecentLogEntry } from '#shared/types/financial'

const props = defineProps<{
  logs: RecentLogEntry[]
  pending?: boolean
}>()

const { t, locale } = useI18n()

const currencyFormatter = computed(() =>
  new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US'),
)

const dateFormatter = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }),
)

function formatCurrency(value: number): string {
  return currencyFormatter.value.format(value)
}

function formatDate(value: string): string {
  return dateFormatter.value.format(new Date(`${value}T00:00:00`))
}

function kindLabel(kind: RecentLogEntry['kind']): string {
  return kind === 'student'
    ? t('dashboard.recentLogs.kinds.student')
    : t('dashboard.recentLogs.kinds.employee')
}

function detailLabel(log: RecentLogEntry): string {
  if (log.kind === 'student') {
    return t(`operator.paymentMethods.${log.detail}`)
  }

  return t(`operator.transactionTypes.${log.detail}`)
}

function kindBadgeClass(kind: RecentLogEntry['kind']): string {
  return kind === 'student'
    ? 'bg-emerald-500/15 text-emerald-400'
    : 'bg-rose-500/15 text-rose-400'
}
</script>

<template>
  <section class="ui-card overflow-hidden">
    <header class="border-b border-zinc-800 px-6 py-4">
      <h2 class="text-lg font-semibold text-zinc-100">
        {{ $t('dashboard.recentLogs.title') }}
      </h2>
      <p class="mt-1 text-sm text-zinc-400">
        {{ $t('dashboard.recentLogs.subtitle') }}
      </p>
    </header>

    <div class="scrollbar-thin overflow-x-auto">
      <table class="ui-table">
        <thead class="ui-table-head">
          <tr>
            <th scope="col" class="ui-table-th">
              {{ $t('dashboard.recentLogs.columns.type') }}
            </th>
            <th scope="col" class="ui-table-th">
              {{ $t('dashboard.recentLogs.columns.person') }}
            </th>
            <th scope="col" class="ui-table-th">
              {{ $t('dashboard.recentLogs.columns.school') }}
            </th>
            <th scope="col" class="ui-table-th">
              {{ $t('dashboard.recentLogs.columns.amount') }}
            </th>
            <th scope="col" class="ui-table-th">
              {{ $t('dashboard.recentLogs.columns.detail') }}
            </th>
            <th scope="col" class="ui-table-th">
              {{ $t('dashboard.recentLogs.columns.date') }}
            </th>
            <th scope="col" class="ui-table-th">
              {{ $t('dashboard.recentLogs.columns.operator') }}
            </th>
          </tr>
        </thead>

        <tbody
          v-if="pending"
          class="divide-y divide-zinc-800"
          aria-busy="true"
          :aria-label="$t('common.loading')"
        >
          <tr v-for="n in 5" :key="n">
            <td v-for="col in 7" :key="col" class="px-6 py-4">
              <div class="ui-skeleton h-4" />
            </td>
          </tr>
        </tbody>

        <tbody
          v-else-if="props.logs.length"
          class="divide-y divide-zinc-800"
        >
          <tr
            v-for="log in props.logs"
            :key="`${log.kind}-${log.id}`"
            class="ui-table-row"
          >
            <td class="px-6 py-4">
              <span
                class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="kindBadgeClass(log.kind)"
              >
                {{ kindLabel(log.kind) }}
              </span>
            </td>
            <td class="px-6 py-4 font-medium text-zinc-100">
              {{ log.personName }}
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-zinc-100">
                {{ log.schoolName }}
              </div>
              <div
                v-if="log.schoolBranch"
                class="text-xs text-zinc-500"
              >
                {{ log.schoolBranch }}
              </div>
            </td>
            <td class="px-6 py-4 text-sm font-medium text-zinc-100">
              {{ formatCurrency(log.amountPaid) }}
            </td>
            <td class="px-6 py-4 text-sm text-zinc-300">
              {{ detailLabel(log) }}
            </td>
            <td class="px-6 py-4 text-sm text-zinc-400">
              {{ formatDate(log.date) }}
            </td>
            <td class="px-6 py-4 text-sm text-zinc-400">
              {{ log.operator }}
            </td>
          </tr>
        </tbody>

        <tbody v-else>
          <tr>
            <td colspan="7" class="px-6 py-12 text-center text-sm text-zinc-500">
              {{ $t('dashboard.recentLogs.empty') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
