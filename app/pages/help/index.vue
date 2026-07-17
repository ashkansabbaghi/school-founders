<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

useHead({
  title: () => t('help.title'),
})

type HelpLink = {
  key: string
  to: string | { path: string, query?: Record<string, string> }
}

type HelpMapGroup = {
  id: 'daily' | 'finance' | 'org' | 'system'
  items: HelpLink[]
  financeTabs?: HelpLink[]
}

const icons: Record<string, string> = {
  dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  finance: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  students: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222',
  employees: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  schools: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  founders: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  offline: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0',
  local: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
  backup: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  install: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
}

const pillars = [
  { key: 'offline' as const, icon: 'offline' },
  { key: 'local' as const, icon: 'local' },
  { key: 'backup' as const, icon: 'backup' },
]

const financePath = computed(() => localePath('/finance'))

const mapGroups = computed<HelpMapGroup[]>(() => [
  {
    id: 'daily',
    items: [
      { key: 'dashboard', to: localePath('/') },
      { key: 'students', to: localePath('/students') },
      { key: 'employees', to: localePath('/employees') },
    ],
  },
  {
    id: 'finance',
    items: [
      { key: 'finance', to: financePath.value },
    ],
    financeTabs: [
      { key: 'financeReport', to: { path: financePath.value, query: { tab: 'report' } } },
      { key: 'financeFixedCosts', to: { path: financePath.value, query: { tab: 'fixedCosts' } } },
      { key: 'financeStudentPayments', to: { path: financePath.value, query: { tab: 'studentPayments' } } },
      { key: 'financeEmployeeExpenses', to: { path: financePath.value, query: { tab: 'employeeExpenses' } } },
    ],
  },
  {
    id: 'org',
    items: [
      { key: 'schools', to: localePath('/schools') },
      { key: 'founders', to: localePath('/founders') },
    ],
  },
  {
    id: 'system',
    items: [
      { key: 'settings', to: localePath('/settings') },
    ],
  },
])

const gettingStartedSteps = [
  { key: 'school' as const },
  { key: 'people' as const },
  { key: 'finance' as const },
  { key: 'backup' as const },
] as const

const tipBlocks = [
  { key: 'academicYear' as const, icon: 'calendar', link: null as string | null },
  { key: 'backup' as const, icon: 'backup', link: '/settings' },
  { key: 'install' as const, icon: 'install', link: '/settings' },
]
</script>

<template>
  <main class="help-page mx-auto max-w-4xl space-y-10 p-4 sm:p-6">
    <!-- Hero -->
    <header class="help-hero relative overflow-hidden rounded-2xl px-6 py-10 sm:px-8 sm:py-12">
      <div
        class="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style="background: radial-gradient(ellipse 90% 80% at 50% 0%, var(--app-gradient-violet), transparent 70%)"
      />
      <div class="relative">
        <h1 class="ui-page-title text-3xl sm:text-4xl">
          {{ $t('help.title') }}
        </h1>
        <p class="mt-3 max-w-2xl text-base leading-relaxed ui-text-secondary sm:text-lg">
          {{ $t('help.overview.body') }}
        </p>
      </div>
    </header>

    <!-- Three pillars -->
    <section :aria-label="$t('help.overview.title')">
      <ul class="grid gap-4 sm:grid-cols-3">
        <li
          v-for="pillar in pillars"
          :key="pillar.key"
          class="flex gap-3 rounded-xl border p-4"
          style="border-color: var(--app-border); background-color: var(--app-surface-muted)"
        >
          <span
            class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-300"
            aria-hidden="true"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.75"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                :d="icons[pillar.icon]"
              />
            </svg>
          </span>
          <div class="min-w-0">
            <p class="text-sm font-semibold ui-text-secondary">
              {{ $t(`help.pillars.${pillar.key}.title`) }}
            </p>
            <p class="mt-0.5 text-sm leading-relaxed ui-text-muted">
              {{ $t(`help.pillars.${pillar.key}.body`) }}
            </p>
          </div>
        </li>
      </ul>
    </section>

    <!-- App structure map -->
    <section class="space-y-6">
      <h2 class="ui-section-header">
        {{ $t('help.map.title') }}
      </h2>

      <div
        v-for="group in mapGroups"
        :key="group.id"
        class="space-y-3"
      >
        <h3 class="text-xs font-semibold uppercase tracking-wide ui-text-muted">
          {{ $t(`help.map.groups.${group.id}`) }}
        </h3>

        <ul
          class="grid gap-3"
          :class="group.items.length > 1 ? 'sm:grid-cols-2 lg:grid-cols-3' : ''"
        >
          <li
            v-for="item in group.items"
            :key="item.key"
            class="ui-card-hover help-map-card flex h-full flex-col gap-3 p-4"
          >
            <NuxtLink
              :to="item.to"
              class="flex items-start gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
            >
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300"
                aria-hidden="true"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.75"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    :d="icons[item.key] ?? icons.finance"
                  />
                </svg>
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium ui-text-secondary">
                  {{ $t(`help.sections.items.${item.key}.title`) }}
                </p>
                <p class="mt-0.5 text-sm leading-relaxed ui-text-muted">
                  {{ $t(`help.sections.items.${item.key}.body`) }}
                </p>
                <span class="mt-2 inline-block text-sm font-medium text-violet-600 dark:text-violet-300">
                  {{ $t(`help.sections.items.${item.key}.link`) }}
                </span>
              </div>
            </NuxtLink>

            <div
              v-if="group.financeTabs"
              class="flex flex-wrap gap-2 border-t pt-3"
              style="border-color: var(--app-border)"
            >
              <NuxtLink
                v-for="tab in group.financeTabs"
                :key="tab.key"
                :to="tab.to"
                class="help-chip rounded-md border px-2.5 py-1 text-xs font-medium text-violet-700 transition-colors duration-200 hover:bg-violet-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 dark:text-violet-300"
                style="border-color: var(--app-border)"
              >
                {{ $t(`help.sections.items.${tab.key}.title`) }}
              </NuxtLink>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- Getting started flow -->
    <section class="space-y-4">
      <div>
        <h2 class="ui-section-header">
          {{ $t('help.gettingStarted.title') }}
        </h2>
        <p class="mt-2 text-sm leading-relaxed ui-text-secondary">
          {{ $t('help.gettingStarted.body') }}
        </p>
      </div>

      <ol class="flex flex-col sm:flex-row sm:items-start">
        <li
          v-for="(step, index) in gettingStartedSteps"
          :key="step.key"
          class="flex flex-1 gap-3 sm:flex-col sm:items-center sm:gap-3 sm:px-1 sm:text-center"
        >
          <div class="flex flex-col items-center self-stretch sm:w-full sm:flex-row sm:items-center">
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-500 text-sm font-semibold text-white"
              aria-hidden="true"
            >
              {{ index + 1 }}
            </span>
            <span
              v-if="index < gettingStartedSteps.length - 1"
              class="help-step-line my-1 w-px flex-1 sm:mx-1 sm:my-0 sm:h-px sm:w-auto sm:flex-1"
              style="background-color: var(--app-border-strong)"
              aria-hidden="true"
            />
          </div>
          <p class="min-w-0 pb-5 text-sm leading-relaxed ui-text-secondary sm:pb-0 sm:pt-1">
            {{ $t(`help.gettingStarted.steps.${step.key}`) }}
          </p>
        </li>
      </ol>
    </section>

    <!-- Academic year + backup + install -->
    <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="block in tipBlocks"
        :key="block.key"
        class="ui-card flex flex-col gap-3 p-5"
      >
        <div class="flex items-center gap-2">
          <span
            class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300"
            aria-hidden="true"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.75"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                :d="icons[block.icon]"
              />
            </svg>
          </span>
          <h2 class="text-sm font-semibold ui-text-secondary">
            {{ $t(`help.${block.key}.title`) }}
          </h2>
        </div>
        <p class="text-sm leading-relaxed ui-text-muted">
          {{ $t(`help.${block.key}.body`) }}
        </p>
        <p
          v-if="block.key === 'backup'"
          class="text-sm leading-relaxed ui-text-muted"
        >
          {{ $t('help.backup.warning') }}
        </p>
        <NuxtLink
          v-if="block.link"
          :to="localePath(block.link)"
          class="mt-auto text-sm font-medium text-violet-600 hover:underline dark:text-violet-300"
        >
          {{ $t(`help.${block.key}.link`) }}
        </NuxtLink>
      </article>
    </section>
  </main>
</template>

<style scoped>
.help-map-card,
.help-chip {
  transition:
    box-shadow 200ms ease,
    background-color 200ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .help-map-card,
  .help-chip {
    transition: none;
  }
}
</style>
