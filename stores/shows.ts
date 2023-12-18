import { defineStore } from 'pinia'
import { useRequestHeaders, useFetch } from 'nuxt/app'

export const useShowsStore = defineStore('showsStore', {
  state: () => ({
    shows: {
      total: '0',
      page: 1,
      pages: 1,
      tv_shows: []
    } as EpisodateSearch
  }),
  getters: {
    getShowById: (state) => {
      return (showId: number) => {
        return Array.isArray(state.shows?.tv_shows) && state.shows.tv_shows.length ? state.shows.tv_shows.find(show => show.id === showId) : null
      }
    }
  },
  actions: {
    async fetchShows () {
      const headers = useRequestHeaders(['cookie']) as HeadersInit
      const { data } = await useFetch('/api/shows', { headers })
      this.shows.tv_shows = data.value as EpisodateShow[]
      this.shows.total = this.shows.tv_shows.length.toString()
    }
  }
})
