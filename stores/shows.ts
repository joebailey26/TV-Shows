import { defineStore } from 'pinia'
import { useRequestHeaders, useFetch } from 'nuxt/app'

export const useShowsStore = defineStore('showsStore', {
  state: () => ({
    shows: [] as EpisodateShow[]
  }),
  getters: {
    getShowById: (state) => {
      return (showId: number) => {
        return state.shows.length ? state.shows.find(show => show.id === showId) : null
      }
    }
  },
  actions: {
    async fetchShows () {
      const headers = useRequestHeaders(['cookie']) as HeadersInit
      const { data } = await useFetch('/api/shows', { headers })
      this.shows = data as unknown as EpisodateShow[]
    }
  }
})
