<style lang="scss">
.partner-form {
  display: flex;
  gap: .5rem;
  align-items: center
}
.add-person-input {
  height: 2rem;
  padding: 0 .5rem;
  font-size: 1.1rem;
  border: none;
  border-radius: 2rem
}
.add-person-submit {
  min-height: 0;
  padding: .5rem;
  font-size: 1.1rem;
}
.partner-list {
  margin-top: 1rem;
  padding-left: 0;
  font-size: 1.1rem;
}
.partner-item {
  display: flex;
  gap: .5rem;
  align-items: center;
  button {
    min-height: 0;
    padding: .5rem;
    padding-top: .8rem;
    color: red;
    background: none;
    border: 0;
    &:hover {
      color: rgb(220 0 0);
      background: none
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
const headers = import.meta.server ? useRequestHeaders(['cookie']) as HeadersInit : undefined
const partners = ref<WatchPartner[]>([])
const newPartner = ref('')

const refresh = async () => {
  try {
    partners.value = await $fetch<WatchPartner[]>('/api/watch-partners' as string, { headers })
  } catch {
    partners.value = []
  }
}

const addPartner = async () => {
  if (!newPartner.value.trim()) { return }
  partners.value = await $fetch<WatchPartner[]>('/api/watch-partners' as string, {
    method: 'POST',
    headers,
    body: { name: newPartner.value }
  })
  newPartner.value = ''
}

const removePartner = async (id: number) => {
  await $fetch(`/api/watch-partners/${id}` as string, { method: 'DELETE', headers })
  await refresh()
}

onMounted(refresh)
</script>
