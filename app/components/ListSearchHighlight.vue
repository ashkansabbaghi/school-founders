<script setup lang="ts">
import { splitSearchHighlight } from '~/utils/listSearch'

const props = defineProps<{
  text: string | number | null | undefined
  query: string
}>()

const segments = computed(() => splitSearchHighlight(props.text, props.query))
</script>

<template>
  <span>
    <template
      v-for="(segment, index) in segments"
      :key="index"
    >
      <mark
        v-if="segment.highlighted"
        class="ui-search-highlight"
      >{{ segment.text }}</mark>
      <template v-else>{{ segment.text }}</template>
    </template>
  </span>
</template>
