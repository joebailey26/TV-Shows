<template>
  <main class="inner-content">
    <Shows :shows="shows" :page-count="pages ?? 0" :delete-show-callback="deleteShowCallback" />
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  async setup () {
    definePageMeta({ middleware: 'auth' })
    const headers = useRequestHeaders(['cookie']) as HeadersInit

    const route = useRoute()
    if (Array.isArray(route.query.category)) {
      route.query.category = route.query.category[0]
    }

    const { data } = await useFetch(`/api/shows?showCategory=${route.query.category}`, { headers })

    const shows = toRef(data.value?.tv_shows)

    const deleteShowCallback = (id: number) => {
      if (shows.value) {
        const index = shows.value.findIndex(show => show.id === id)
        if (index !== -1) { shows.value.splice(index, 1) }
      }
    }

    return {
      shows,
      pages: data.value?.pages,
      deleteShowCallback
    }
  }
})
</script>
