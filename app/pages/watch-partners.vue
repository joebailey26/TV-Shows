<style lang="scss">
.partner-form {
  display: flex;
  align-items: center;
  gap: .5rem
}
.add-person-input {
  height: 2rem;
  padding: 0 .5rem;
  font-size: 1.1rem;
  border: none;
  border-radius: 2rem
}
.add-person-submit {
  font-size: 1.1rem;
  padding: .5rem;
  min-height: 0;
}
.partner-list {
  font-size: 1.1rem;
  padding-left: 0;
  margin-top: 1rem;
}
.partner-item {
  display: flex;
  gap: .5rem;
  align-items: center;
  button {
    min-height: 0;
    padding: .5rem;
    padding-top: .8rem;
    color: rgb(255, 0, 0);
    background: none;
    border: 0;
    &:hover {
      background: none;
      color: rgb(220, 0, 0)
    }
  }
}
</style>

<template>
  <main class="inner-content partners-page">
    <h1>Friends & Family</h1>
    <form class="partner-form" @submit.prevent="addPartner">
      <input v-model="newPartner" class="add-person-input" type="text" placeholder="Add a person" aria-label="Partner name" maxlength="64">
      <button class="button add-person-submit" type="submit">Add</button>
    </form>
    <ul class="partner-list">
      <li v-for="partner in partners" :key="partner.id" class="partner-item">
        {{ partner.name }}
        <button type="button" class="button" :aria-label="`Remove ${partner.name}`" @click="removePartner(partner.id)">X</button>
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
