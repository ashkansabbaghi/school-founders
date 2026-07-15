<script setup lang="ts">
import type { School } from '#shared/types/financial'

defineProps<{
  schools: School[]
  pending?: boolean
}>()

defineEmits<{
  edit: [school: School]
  delete: [id: string]
}>()
</script>

<template>
  <section class="space-y-4">
    <h2 class="ui-section-header">
      {{ $t('schools.listTitle') }}
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
        <div class="ui-skeleton h-10 w-10 shrink-0 rounded-lg" />
        <div class="flex-1 space-y-2">
          <div class="ui-skeleton h-4 w-32" />
          <div class="ui-skeleton h-3 w-24" />
        </div>
        <div class="ui-skeleton h-8 w-24 rounded-lg" />
      </li>
    </ul>

    <TransitionGroup
      v-else-if="schools.length"
      tag="ul"
      name="list-item"
      appear
      class="space-y-3"
    >
      <li
        v-for="school in schools"
        :key="school.id"
        class="ui-card-hover flex items-center gap-4 p-4"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sm font-semibold text-sky-300"
          aria-hidden="true"
        >
          {{ school.name.charAt(0) }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-medium">
            {{ school.name }}
          </div>
          <div class="truncate text-sm ui-text-muted">
            {{ school.branch }}
          </div>
        </div>
        <div class="flex shrink-0 gap-2">
          <button
            type="button"
            class="ui-btn-secondary px-3 py-1.5"
            @click="$emit('edit', school)"
          >
            {{ $t('common.edit') }}
          </button>
          <button
            type="button"
            class="ui-btn-danger px-3 py-1.5"
            @click="$emit('delete', school.id)"
          >
            {{ $t('common.delete') }}
          </button>
        </div>
      </li>
    </TransitionGroup>

    <div
      v-else
      class="ui-empty-state"
    >
      {{ $t('schools.empty') }}
    </div>
  </section>
</template>
