<script setup lang="ts">
import type { PaginationMeta } from '~/utils/pagination'

defineProps<{
  meta: PaginationMeta
}>()

defineEmits<{
  previous: []
  next: []
}>()

const { t } = useI18n()
</script>

<template>
  <nav
    class="ui-pagination"
    :aria-label="t('common.pagination.navLabel')"
  >
    <button
      type="button"
      class="ui-btn-secondary"
      :disabled="!meta.hasPrevious"
      @click="$emit('previous')"
    >
      {{ t('common.pagination.previous') }}
    </button>

    <span class="ui-pagination-range">
      {{
        t('common.pagination.range', {
          start: meta.startIndex,
          end: meta.endIndex,
          total: meta.totalItems,
        })
      }}
    </span>

    <button
      type="button"
      class="ui-btn-secondary"
      :disabled="!meta.hasNext"
      @click="$emit('next')"
    >
      {{ t('common.pagination.next') }}
    </button>
  </nav>
</template>
