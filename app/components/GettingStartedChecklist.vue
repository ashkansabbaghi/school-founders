<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const {
  visible,
  items,
  completedCount,
  totalCount,
  progressPercent,
  dismiss,
  refresh,
} = useGettingStartedChecklist()

defineExpose({ refresh })
</script>

<template>
  <div
    v-if="visible"
    class="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4"
    role="status"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="font-medium">
          {{ t('dashboard.gettingStarted.title') }}
        </p>
        <p class="mt-1 text-sm ui-text-muted">
          {{ t('dashboard.gettingStarted.subtitle') }}
        </p>
      </div>
      <button
        type="button"
        class="ui-btn-secondary shrink-0 self-start"
        @click="dismiss"
      >
        {{ t('dashboard.gettingStarted.dismiss') }}
      </button>
    </div>

    <div class="mt-4">
      <div class="flex items-center justify-between gap-3 text-sm">
        <span class="ui-text-secondary">
          {{ t('dashboard.gettingStarted.progress', {
            done: completedCount,
            total: totalCount,
          }) }}
        </span>
        <span class="tabular-nums ui-text-muted">
          {{ Math.round(progressPercent) }}%
        </span>
      </div>
      <div class="mt-1.5 h-2 w-full ui-progress-track">
        <div
          class="h-full rounded-full bg-violet-500 transition-all"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>

    <ul class="mt-4 space-y-2">
      <li
        v-for="item in items"
        :key="item.id"
        class="flex items-center justify-between gap-3 rounded-lg px-2 py-2"
      >
        <div class="flex min-w-0 items-center gap-3">
          <span
            class="flex size-6 shrink-0 items-center justify-center rounded-full text-sm"
            :class="item.done
              ? 'bg-emerald-500/20 text-emerald-500'
              : 'border border-current/30 ui-text-muted'"
            aria-hidden="true"
          >
            <template v-if="item.done">
              ✓
            </template>
          </span>
          <span
            class="truncate font-medium"
            :class="item.done ? 'ui-text-muted line-through' : ''"
          >
            {{ t(`dashboard.gettingStarted.items.${item.id}.title`) }}
          </span>
        </div>
        <NuxtLink
          v-if="!item.done"
          :to="localePath(item.to)"
          class="shrink-0 text-sm font-medium text-violet-600 hover:underline dark:text-violet-300"
        >
          {{ t(`dashboard.gettingStarted.items.${item.id}.action`) }}
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
