<style lang="scss" scoped>
form {
  text-align: left
}
form * {
  display: inline
}
</style>
<template>
  <div class="search_container container">
    <form @submit.prevent="search">
      <label for="search">
        <h2>Search for a show</h2>
        <div>
          <input v-model="searchData" type="text" name="search">
        </div>
      </label>
      <div>
        <input type="submit" value="Search">
      </div>
    </form>
    <transition name="fade">
      <div v-if="searchResults && !!Object.keys(searchResults).length" class="shows_container container">
        <Show
          v-for="show in searchResults.tv_shows"
          :key="`searching_${show.id}`"
          :show="show"
          :add-show-callback="addShowCallback"
        />
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  setup () {
    const state = reactive({
      searchData: '' as string,
      searchResults: {} as EpisodateSearch | Partial<EpisodateSearch>
    })

    return state
  },
  methods: {
    async search () {
      const { data } = await useFetch(`https://www.episodate.com/api/search?q=${this.searchData}`, {
        method: 'POST'
      })
      this.searchResults = data as unknown as EpisodateSearch
    },
    addShowCallback () {
      this.searchData = ''
      this.searchResults = {} as Partial<EpisodateSearch>
    }
  }
})
</script>
