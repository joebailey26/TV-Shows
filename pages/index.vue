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
    <Search />
    <div style="text-align: left">
      <a class="button" :href="`/api/calendar/${userEmail}`" target="_blank" :download="`tv_joebailey_xyz_calendar_${userEmail}`">Download calendar</a>
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
import { useRequestHeaders } from 'nuxt/app'
import { mapState } from 'pinia'
import { defineComponent, reactive } from 'vue'
import { useShowsStore } from '../stores/shows'

definePageMeta({ middleware: 'auth' })

export default defineComponent({
  async setup () {
    const state = reactive({
      userEmail: ''
    })

    const { user } = useAuth()
    if (user.value?.email) {
      state.userEmail = user.value.email
    }

    // Even though we have this function defined in Pinia,
    // Nuxt get's confused and can't hydrate correctly,
    // So we have to fetch the shows here and assign it to the store
    const headers = useRequestHeaders(['cookie']) as HeadersInit
    const { data } = await useAsyncData('shows', async () => {
      const { data } = await useFetch('/api/shows', { headers })
      return data
    })

    const store = useShowsStore()
    store.shows = data as unknown as EpisodateShow[]

    return state
  },
  computed: {
    ...mapState(useShowsStore, ['shows'])
  }
})
</script>
