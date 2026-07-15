<script setup lang="ts">
const { toast } = useAppToast()
</script>

<template>
  <Teleport to="body">
    <Transition name="toast-slide">
      <div
        v-if="toast"
        class="app-toast pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4 sm:px-6"
      >
        <div
          :class="toast.kind === 'success' ? 'ui-alert-success' : 'ui-alert-error'"
          :role="toast.kind === 'success' ? 'status' : 'alert'"
          class="pointer-events-auto w-full max-w-2xl shadow-lg"
        >
          {{ toast.message }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
