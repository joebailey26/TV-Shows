<template>
  <main class="inner-content">
    <h2>Searching for: {{ route.query.q }}</h2>
    <Shows :shows="searchResults.tv_shows" :add-show-callback="addShowCallback" :page-count="searchResults.pages" />
  </main>
</template>

<script lang="ts">
import { defineComponent, watch, toRefs } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({ middleware: 'auth' })

export default defineComponent({
  async setup () {
    const state = reactive({
      searchResults: {} as EpisodateSearch | Partial<EpisodateSearch>
    })

    const refs = toRefs(state)

    const route = useRoute()
    const router = useRouter()

    const fetchShows = async () => {
      refs.searchResults.value = {}
      const { data } = await useFetch(`https://www.episodate.com/api/search?q=${route.query.q}&page=${route.query.p ?? 1}`, {
        method: 'POST'
      })
      refs.searchResults.value = data.value as EpisodateSearch
    }

    await fetchShows()

    watch(() => [route.query.p], async () => {
      await fetchShows()
      window.scrollTo(0, 0)
    }, { immediate: false })

    const addShowCallback = () => {
      refs.searchResults.value = {} as Partial<EpisodateSearch>
      router.push('/my-shows')
    }

    return { ...refs, addShowCallback, route }
  }
})
</script>
