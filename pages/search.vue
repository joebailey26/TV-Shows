<template>
  <main class="inner-content">
    <h2>Searching for: {{ route.query.q }}</h2>
    <Shows :shows="searchResults.tv_shows" :add-show-callback="addShowCallback" :page-count="searchResults.pages" />
  </main>
</template>

<script lang="ts">
import { defineComponent, watch, toRefs } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default defineComponent({
  async setup () {
    definePageMeta({ middleware: 'auth' })

    const state = reactive({
      searchResults: {} as EpisodateSearch
    })

    const refs = toRefs(state)

    const route = useRoute()
    const router = useRouter()

    const resetSearchResults = () => {
      refs.searchResults.value = {
        total: '0',
        page: 0,
        pages: 0,
        tv_shows: []
      }
    }

    const fetchShows = async () => {
      resetSearchResults()
      const { data } = await useFetch(`https://www.episodate.com/api/search?q=${route.query.q}&page=${route.query.p ?? 1}`, {
        method: 'POST'
      })
      refs.searchResults.value = data.value as EpisodateSearch
    }

    watch(() => [route.query.p], async () => {
      await fetchShows()
      window.scrollTo(0, 0)
    }, { immediate: false })

    await fetchShows()

    const addShowCallback = () => {
      resetSearchResults()
      router.push('/my-shows')
    }

    return { ...refs, addShowCallback, route }
  }
})
</script>
