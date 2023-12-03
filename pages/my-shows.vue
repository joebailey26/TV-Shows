<style lang="scss">
.shows_container {
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(auto-fit, 250px);
  margin: 2rem 0
}
</style>

<template>
  <div>
    <Nav />
    <main class="inner-content">
      <h2>Currently Watching</h2>
      <transition name="fade">
        <div v-if="shows && shows.length" class="shows_container">
          <Show
            v-for="show in shows"
            :key="show.id"
            :show="show"
          />
        <!-- <Pagination /> -->
        </div>
      </transition>
    </main>
  </div>
</template>

<script lang="ts">
import { mapState } from 'pinia'
import { defineComponent } from 'vue'
import { useShowsStore } from '../stores/shows'

definePageMeta({ middleware: 'auth' })

export default defineComponent({
  async setup () {
    const store = useShowsStore()
    await store.fetchShows()
  },
  computed: {
    ...mapState(useShowsStore, ['shows'])
  }
})
</script>
