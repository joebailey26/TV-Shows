<template>
  <main class="inner-content">
    <h2>Searching for: {{ route.query.q }}</h2>
    <template v-if="searchResults?.tv_shows">
      <Shows :shows="searchResults?.tv_shows" :add-show-callback="addShowCallback" :page-count="searchResults?.pages" :should-go-to-show="false" />
    </template>
    <template v-else>
      <p>Something went wrong...</p>
      <p>Please try again later</p>
    </template>
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
      const { data } = await useFetch(`/api/search?q=${route.query.q}&p=${route.query.p ?? 1}`)
      refs.searchResults.value = data.value as EpisodateSearch
    }

    watch(() => [route.query.p], async () => {
      await fetchShows()
      window.scrollTo(0, 0)
    }, { immediate: false })

    await fetchShows()

    const addShowCallback = () => {
      router.push('/my-shows/currently-watching')
    }

    return { ...refs, addShowCallback, route }
  }
})
</script>
