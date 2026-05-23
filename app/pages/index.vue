<script setup lang="ts">
const { t } = useI18n()

useHead({
  title: () => t('home.title'),
})

const { founders, status, createFounder, deleteFounder } = useFounders()

const name = ref('')
const school = ref('')

async function onSubmit() {
  if (!name.value.trim()) {
    return
  }

  await createFounder({
    name: name.value,
    school: school.value || undefined,
  })

  name.value = ''
  school.value = ''
}

async function onDelete(id: string) {
  await deleteFounder(id)
}
</script>

<template>
  <main class="mx-auto max-w-2xl space-y-8 p-6">
    <header>
      <h1 class="text-2xl font-bold text-gray-900">
        {{ $t('home.title') }}
      </h1>
    </header>

    <form @submit.prevent="onSubmit">
      <label>
        {{ $t('home.name') }}
        <input v-model="name" type="text" required>
      </label>
      <label>
        {{ $t('home.school') }}
        <input v-model="school" type="text">
      </label>
      <button type="submit">
        {{ $t('home.addFounder') }}
      </button>
    </form>

    <FounderList
      :founders="founders ?? []"
      :pending="status === 'pending'"
      @delete="onDelete"
    />
  </main>
</template>
