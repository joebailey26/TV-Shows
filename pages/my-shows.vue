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

    const shows = ref([]) as Ref<EpisodateShowFromSearchTransformed[]>
    const pages = ref(0)

    const route = useRoute()
    if (Array.isArray(route.query.category)) {
      route.query.category = route.query.category[0]
    }

    const fetchShows = async () => {
      const { data } = await useFetch('/api/shows', {
        headers,
        query: {
          showCategory: route.query.category,
          p: route.query.p
        }
      })
      shows.value = data.value?.tv_shows ?? []
      pages.value = data.value?.pages ?? 0
    }

    await fetchShows()

    watch(() => [route.query.category, route.query.p], () => {
      fetchShows()
    })

    const deleteShowCallback = (id: number) => {
      const index = shows.value.findIndex(show => show.id === id)
      if (index !== -1) { shows.value.splice(index, 1) }
    }

    return {
      shows,
      pages,
      deleteShowCallback
    }
  }
})
</script>
