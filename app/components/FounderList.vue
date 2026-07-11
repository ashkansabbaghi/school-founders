<script setup lang="ts">
import type { Founder } from '#shared/types/founder'

defineProps<{
  founders: Founder[]
  pending?: boolean
}>()

defineEmits<{
  delete: [id: string]
}>()

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(part => part.length > 0)
  const first = parts[0]
  if (!first) {
    return '?'
  }
  if (parts.length === 1) {
    return first.slice(0, 2).toUpperCase()
  }
  const last = parts[parts.length - 1] ?? first
  return (first.charAt(0) + last.charAt(0)).toUpperCase()
}
</script>

<template>
  <section class="space-y-4">
    <h2 class="ui-section-header">
      {{ $t('founders.listTitle') }}
    </h2>

    <ul
      v-if="pending"
      class="space-y-3"
      aria-busy="true"
      :aria-label="$t('common.loading')"
    >
      <li
        v-for="n in 3"
        :key="n"
        class="ui-card flex items-center gap-4 p-4"
      >
        <div class="ui-skeleton h-10 w-10 shrink-0 rounded-full" />
        <div class="flex-1 space-y-2">
          <div class="ui-skeleton h-4 w-32" />
          <div class="ui-skeleton h-3 w-24" />
        </div>
        <div class="ui-skeleton h-8 w-16 rounded-lg" />
      </li>
    </ul>

    <TransitionGroup
      v-else-if="founders.length"
      tag="ul"
      name="list-item"
      appear
      class="space-y-3"
    >
      <li
        v-for="founder in founders"
        :key="founder.id"
        class="ui-card-hover flex items-center gap-4 p-4"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-sm font-semibold text-violet-300"
          aria-hidden="true"
        >
          {{ getInitials(founder.name) }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-medium text-zinc-100">
            {{ founder.name }}
          </div>
          <div
            v-if="founder.school"
            class="truncate text-sm text-zinc-400"
          >
            {{ founder.school }}
          </div>
        </div>
        <button
          type="button"
          class="ui-btn-danger shrink-0 px-3 py-1.5"
          @click="$emit('delete', founder.id)"
        >
          {{ $t('common.delete') }}
        </button>
      </li>
    </TransitionGroup>

    <div
      v-else
      class="ui-empty-state"
    >
      {{ $t('founders.empty') }}
    </div>
  </section>
</template>
