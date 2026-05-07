<template>
  <main class="inner-content partners-page">
    <h1>Friends & Family</h1>
    <form class="partner-form" @submit.prevent="addPartner">
      <input v-model="newPartner" type="text" placeholder="Add a person" maxlength="64">
      <button class="button" type="submit">Add</button>
    </form>
    <ul>
      <li v-for="partner in partners" :key="partner.id">
        {{ partner.name }}
        <button type="button" class="button" @click="removePartner(partner.id)">Remove</button>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const headers = useRequestHeaders(['cookie']) as HeadersInit
const partners = ref<{id:number, name:string}[]>([])
const newPartner = ref('')

const refresh = async () => {
  partners.value = await $fetch('/api/watch-partners', { headers })
}

const addPartner = async () => {
  if (!newPartner.value.trim()) { return }
  partners.value = await $fetch('/api/watch-partners', {
    method: 'POST',
    headers,
    body: { name: newPartner.value }
  })
  newPartner.value = ''
}

const removePartner = async (id: number) => {
  await $fetch(`/api/watch-partners/${id}`, { method: 'DELETE', headers })
  await refresh()
}

await refresh()
</script>
