<style lang="scss" scoped>
h1 {
  margin-top: 0
}
.header {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2rem;
  padding-top: 2rem;
  img{
    display: block;
    width: auto;
    max-width: 450px;
    height: auto;
    aspect-ratio: 3/4.2;
    object-fit: cover
  }
}
.info {
  display: grid;
  gap: 1rem
}
</style>

<template>
  <div v-if="name" class="inner-content">
    <div class="header">
      <img :src="image_path ?? image_thumbnail_path" width="250">
      <div class="content">
        <h1 v-html="name" />
        <p v-html="description" />
        <div class="info">
          <span>Network: {{ network }}</span>
          <span>Average Runtime: {{ runtime }}</span>
          <span>Start Date: {{ start_date }}</span>
        </div>
        <h2>
          Latest Watched Episode:
        </h2>
        <div v-for="season in seasons" :key="season.season">
          Season {{ season.season }}
          <div v-for="episode in season.episodes" :key="episode.episode">
            <Episode v-if="episode.episode" :episode="episode" :set-episode-callback="updateShow" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { storeToRefs } from 'pinia'
import type { EpisodateShowEpisode } from '../../types/episodate'
import { useShowsStore } from '../../stores/shows'

type Season = {
  season: number
  episodes: EpisodateShowEpisode[]
}

type ExtendedEpisodateShow = Show & {
  seasons: Season[];
}

export default defineComponent({
  setup () {
    // @ts-expect-error
    const headers = useRequestHeaders(['cookie']) as HeadersInit
    // @ts-expect-error
    definePageMeta({ middleware: 'auth' })
    // @ts-expect-error
    const route = useRoute()
    const showsStore = useShowsStore()
    const { getShowById } = storeToRefs(showsStore)
    const showId = parseInt(route.params.id)
    const show = getShowById.value(showId) as ExtendedEpisodateShow

    if (!show) {
      return { name: null }
    }

    const episodesBySeason = [] as Season[]

    if (show.episodes) {
      for (const episode of show.episodes) {
        let season = episodesBySeason.find(findEpisode => episode.season === findEpisode.season)
        if (!season) {
          season = {
            season: episode.season,
            episodes: []
          }
          episodesBySeason.push(season)
        }
        season.episodes.push(episode)
      }

      show.seasons = episodesBySeason
      show.seasons.sort((a, b) => b.season - a.season)
      show.seasons.forEach((season) => {
        season.episodes.sort((a, b) => new Date(a.air_date).getTime() - new Date(b.air_date).getTime())
      })
    }

    async function updateShow (episode: EpisodateShowEpisode) {
      const response = await fetch(`/api/show/${showId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          episodeAirDate: episode.air_date
        })
      })

      if (response.ok) {
        // showsStore.updateLatestWatchedEpisode(showId, episode.air_date)
      }
    }

    return { ...show, updateShow }
  }
})
</script>
