<style lang="scss">
main {
  margin: 0 auto;
  padding: 1em;
  text-align: center
}
h1, h2 {
  text-align: left
}
h2 {
  margin: 0
}
.container {
  margin: 2rem 0
}
.shows_container {
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(auto-fit, 250px);
  justify-content: center
}

@media (min-width: 640px) {
  main {
    max-width: none
  }
}
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s
}
.fade-enter, .fade-leave-to {
  opacity: 0
}
</style>

<template>
  <main>
    <h1>TV Shows</h1>
    <button @click="signOut()">
      Sign Out
    </button>
    <Search />
    <div style="text-align: left">
      <a class="button" :href="`/api/calendar/${userId}`" target="_blank" :download="`tv_joebailey_xyz_calendar_${userId}`">Download calendar</a>
    </div>
    <h2>Currently Watching</h2>
    <transition name="fade">
      <div v-if="shows && shows.length" class="shows_container container">
        <Show
          v-for="show in shows"
          :key="show.id"
          :show="show"
        />
      <!-- <Pagination /> -->
      </div>
    </transition>
  </main>
</template>

<script lang="ts">
import { mapState } from 'pinia'
import { defineComponent, reactive } from 'vue'
import { useShowsStore } from '../stores/shows'

definePageMeta({ middleware: 'auth' })

export default defineComponent({
  async setup () {
    const { signOut } = useAuth()

    const state = reactive({
      userId: '',
      signOut
    })

    const { user } = useAuth()
    if (user.value?.id) {
      state.userId = user.value.id
    }

    const store = useShowsStore()
    await store.fetchShows()

    return state
  },
  computed: {
    ...mapState(useShowsStore, ['shows'])
  }
})
</script>
