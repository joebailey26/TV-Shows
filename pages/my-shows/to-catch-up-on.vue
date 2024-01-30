<template>
  <main class="inner-content">
    <h2>To Catch Up On</h2>
    <Shows :shows="tv_shows" :page-count="pages" />
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  async setup () {
    definePageMeta({ middleware: 'auth' })
    const headers = useRequestHeaders(['cookie']) as HeadersInit
    const { data } = await useFetch('/api/shows?toCatchUpOn=1', { headers })
    return data.value as EpisodateSearch
  }
})
</script>
