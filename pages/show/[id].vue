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
  <div class="inner-content">
    <div class="header">
      <img :src="image_path ?? image_thumbnail_path ?? 'https://placehold.co/250x600'" width="250">
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
import type { EpisodateShowEpisode } from '../../types/episodate'

interface Season {
  season: number;
  episodes: EpisodateShowEpisode[];
}

interface EpisodateShowWithSeasons extends EpisodateShow {
  seasons: Season[];
}

export default defineComponent({
  async setup () {
    const headers = useRequestHeaders(['cookie']) as HeadersInit
    definePageMeta({ middleware: 'auth' })
    const route = useRoute()
    if (Array.isArray(route.params.id)) {
      route.params.id = route.params.id[0]
    }
    const showId = parseInt(route.params.id)
    const response = await useFetch(`/api/show/${showId}`, {
      headers
    })

    let show = response.data.value as EpisodateShowWithSeasons

    if (!show?.name) {
      throw createError({ statusCode: 404, message: 'Page not found' })
    }

    if (show.episodes && show.episodes.length > 0) {
      const seasons = show.episodes.reduce((acc: Record<number, EpisodateShowEpisode[]>, episode) => {
        const seasonNumber = episode.season
        if (!acc[seasonNumber]) {
          acc[seasonNumber] = []
        }
        acc[seasonNumber].push(episode)
        return acc
      }, {})

      show.seasons = Object.keys(seasons).map(season => ({
        season: parseInt(season, 10),
        episodes: seasons[parseInt(season, 10)]
      }))
    }

    async function updateShow (episode: EpisodateShowEpisode) {
      const response = await useFetch(`/api/show/${showId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          episode
        })
      })

      // ToDo
      //  This endpoint does not return the show at the moment. Should we, or re-call the getShow method? Or add a watcher to the getShow useFetch?
      show = response.data.value as EpisodateShow
    }

    return {
      ...show,
      updateShow
    }
  }
})
</script>
