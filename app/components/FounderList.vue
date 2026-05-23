<script setup lang="ts">
import type { Founder } from '~/composables/useFounders'

defineProps<{
  founders: Founder[]
  pending?: boolean
}>()

defineEmits<{
  delete: [id: string]
}>()
</script>

<template>
  <section>
    <h2>{{ $t('founders.listTitle') }}</h2>
    <p v-if="pending">
      {{ $t('common.loading') }}
    </p>
    <ul v-else-if="founders.length">
      <li v-for="founder in founders" :key="founder.id">
        <strong>{{ founder.name }}</strong>
        <span v-if="founder.school"> — {{ founder.school }}</span>
        <button type="button" @click="$emit('delete', founder.id)">
          {{ $t('common.delete') }}
        </button>
      </li>
    </ul>
    <p v-else>
      {{ $t('founders.empty') }}
    </p>
  </section>
</template>
