<template />

<script lang="ts">
import { defineComponent } from 'vue'

definePageMeta({ middleware: 'auth' })

export default defineComponent({
  async setup () {
    const route = useRoute()
    const headers = useRequestHeaders(['cookie']) as HeadersInit
    const { data } = await useFetch(`/api/show/${route.params.slug}`, { headers })
    return data.value as EpisodateShow[]
  }
})
</script>
