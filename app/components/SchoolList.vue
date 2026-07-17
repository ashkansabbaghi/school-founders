<script setup lang="ts">
import type { School } from '#shared/types/financial'
import { matchesListSearch } from '~/utils/listSearch'

const props = defineProps<{
  schools: School[]
  pending?: boolean
}>()

defineEmits<{
  edit: [school: School]
  delete: [id: string]
}>()

const searchQuery = ref('')

const filteredSchools = computed(() =>
  props.schools.filter(school =>
    matchesListSearch(searchQuery.value, [school.name, school.branch]),
  ),
)

const isSearchEmpty = computed(() =>
  searchQuery.value.trim().length > 0
  && props.schools.length > 0
  && filteredSchools.value.length === 0,
)

const { paginatedItems, meta, goNext, goPrevious } = usePagination(filteredSchools)
</script>

<template>
  <section class="space-y-4">
    <h2 class="ui-section-header">
      {{ $t('schools.listTitle') }}
    </h2>

    <ListSearchInput
      v-model="searchQuery"
      :placeholder="$t('schools.searchPlaceholder')"
      :disabled="schools.length === 0"
    />

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

    <div
      v-else-if="filteredSchools.length"
      class="space-y-3"
    >
      <TransitionGroup
        tag="ul"
        name="list-item"
        appear
        class="space-y-3"
      >
        <li
          v-for="school in paginatedItems"
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
              <ListSearchHighlight
                :text="school.name"
                :query="searchQuery"
              />
            </div>
            <div class="truncate text-sm ui-text-muted">
              <ListSearchHighlight
                :text="school.branch"
                :query="searchQuery"
              />
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
      <ListPagination
        v-if="meta.showPagination"
        :meta="meta"
        @previous="goPrevious"
        @next="goNext"
      />
    </div>

    <div
      v-else
      class="ui-empty-state"
    >
      {{ isSearchEmpty ? $t('common.noSearchResults') : $t('schools.empty') }}
    </div>
  </section>
</template>
