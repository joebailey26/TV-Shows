<template>
  <main class="inner-content">
    <h2>Searching for: {{ route.query.q }}</h2>
    <Shows :shows="searchResults" :add-show-callback="addShowCallback" />
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  async setup () {
    const state = reactive({
      searchResults: {} as EpisodateSearch | Partial<EpisodateSearch>
    })

    const route = useRoute()
    const router = useRouter()

    const { data } = await useFetch(`https://www.episodate.com/api/search?q=${route.query.q}`, {
      method: 'POST'
    })
    state.searchResults = data.value as EpisodateSearch

    const addShowCallback = () => {
      state.searchResults = {} as Partial<EpisodateSearch>
      router.push('/my-shows')
    }

    return { ...state, addShowCallback, route }
  }
})
</script>
