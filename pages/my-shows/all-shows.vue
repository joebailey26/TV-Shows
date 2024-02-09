<template>
  <main class="inner-content">
    <h2>All Shows</h2>
    <Shows :shows="tv_shows" :page-count="pages ?? 0" />
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  async setup () {
    definePageMeta({ middleware: 'auth' })
    const headers = useRequestHeaders(['cookie']) as HeadersInit
    const { data } = await useFetch('/api/shows', { headers })
    return data.value
  }
})
</script>
