<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { RecentLogEntry } from '#shared/types/financial'
import { formatIsoDateDisplay } from '#shared/utils/jalaliDate'
import { matchesListSearch } from '~/utils/listSearch'

const props = defineProps<{
  logs: RecentLogEntry[]
  pending?: boolean
}>()

const { t, locale } = useI18n()
const searchQuery = ref('')

const filteredLogs = computed(() =>
  props.logs.filter(log =>
    matchesListSearch(searchQuery.value, [log.personName, log.schoolName]),
  ),
)

const { paginatedItems, meta, goNext, goPrevious } = usePagination(filteredLogs)

const isSearchEmpty = computed(() =>
  searchQuery.value.trim().length > 0
  && props.logs.length > 0
  && filteredLogs.value.length === 0,
)

const currencyFormatter = computed(() =>
  new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US'),
)

function formatCurrency(value: number): string {
  return currencyFormatter.value.format(value)
}

function formatDate(value: string): string {
  if (locale.value === 'fa') {
    return formatIsoDateDisplay(value)
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
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
    <header class="ui-card-header space-y-4">
      <div>
        <h2 class="text-lg font-semibold">
          {{ $t('dashboard.recentLogs.title') }}
        </h2>
        <p class="mt-1 text-sm ui-text-muted">
          {{ $t('dashboard.recentLogs.subtitle') }}
        </p>
      </div>
      <ListSearchInput
        v-model="searchQuery"
        :placeholder="$t('dashboard.recentLogs.searchPlaceholder')"
      />
    </header>

    <div class="md:hidden">
      <ul
        v-if="pending"
        class="ui-divide-y"
        aria-busy="true"
        :aria-label="$t('common.loading')"
      >
        <li
          v-for="n in 5"
          :key="n"
          class="space-y-2 p-4"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="ui-skeleton h-5 w-16 rounded-full" />
            <div class="ui-skeleton h-6 w-24" />
          </div>
          <div class="ui-skeleton h-4 w-40" />
          <div class="ui-skeleton h-3 w-32" />
        </li>
      </ul>

      <ul
        v-else-if="filteredLogs.length"
        class="ui-divide-y"
      >
        <li
          v-for="log in paginatedItems"
          :key="`${log.kind}-${log.id}`"
          class="p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <span
              class="inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              :class="kindBadgeClass(log.kind)"
            >
              {{ kindLabel(log.kind) }}
            </span>
            <span class="text-lg font-semibold">
              {{ formatCurrency(log.amountPaid) }}
            </span>
          </div>

          <div class="mt-2">
            <div class="font-medium">
              <ListSearchHighlight
                :text="log.personName"
                :query="searchQuery"
              />
            </div>
            <div class="text-sm ui-text-muted">
              <ListSearchHighlight
                :text="log.schoolName"
                :query="searchQuery"
              />
              <span v-if="log.schoolBranch"> — {{ log.schoolBranch }}</span>
            </div>
          </div>

          <div class="mt-1.5 text-sm ui-text-secondary">
            {{ detailLabel(log) }}
          </div>

          <div class="mt-2 text-xs text-zinc-500">
            {{ formatDate(log.date) }}
          </div>
        </li>
      </ul>

      <div
        v-else
        class="ui-empty-state"
      >
        {{ isSearchEmpty ? $t('common.noSearchResults') : $t('dashboard.recentLogs.empty') }}
      </div>
    </div>

    <div class="ui-table-scroll hidden md:block">
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
          </tr>
        </thead>

        <tbody
          v-if="pending"
          class="ui-divide-y"
          aria-busy="true"
          :aria-label="$t('common.loading')"
        >
          <tr v-for="n in 5" :key="n">
            <td v-for="col in 6" :key="col" class="px-6 py-4">
              <div class="ui-skeleton h-4" />
            </td>
          </tr>
        </tbody>

        <tbody
          v-else-if="filteredLogs.length"
          class="ui-divide-y"
        >
          <tr
            v-for="log in paginatedItems"
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
            <td class="px-6 py-4 font-medium">
              <ListSearchHighlight
                :text="log.personName"
                :query="searchQuery"
              />
            </td>
            <td class="px-6 py-4">
              <div class="text-sm">
                <ListSearchHighlight
                  :text="log.schoolName"
                  :query="searchQuery"
                />
              </div>
              <div
                v-if="log.schoolBranch"
                class="text-xs text-zinc-500"
              >
                {{ log.schoolBranch }}
              </div>
            </td>
            <td class="px-6 py-4 text-sm font-medium">
              {{ formatCurrency(log.amountPaid) }}
            </td>
            <td class="px-6 py-4 text-sm ui-text-secondary">
              {{ detailLabel(log) }}
            </td>
            <td class="px-6 py-4 text-sm ui-text-muted">
              {{ formatDate(log.date) }}
            </td>
          </tr>
        </tbody>

        <tbody v-else>
          <tr>
            <td colspan="6" class="px-6 py-12 text-center text-sm text-zinc-500">
              {{ isSearchEmpty ? $t('common.noSearchResults') : $t('dashboard.recentLogs.empty') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ListPagination
      v-if="!pending && meta.showPagination"
      :meta="meta"
      @previous="goPrevious"
      @next="goNext"
    />
  </section>
</template>
