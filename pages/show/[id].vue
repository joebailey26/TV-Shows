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
import type { EpisodateShowEpisode } from '../../types/episodate'

export default defineComponent({
  setup () {
    const headers = useRequestHeaders(['cookie']) as HeadersInit
    definePageMeta({ middleware: 'auth' })
    const route = useRoute()
    if (Array.isArray(route.params.id)) {
      route.params.id = route.params.id[0]
    }
    const showId = parseInt(route.params.id)
    const show = getShowById.value(showId) as EpisodateShow

    if (!show) {
      return { name: null }
    }

    async function updateShow (episode: EpisodateShowEpisode) {
      const response = await fetch(`/api/show/${showId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          episode
        })
      })

      if (response.ok) {
        showsStore.updateLatestWatchedEpisode(showId, episode)
      }
    }

    return { ...show, updateShow }
  }
})
</script>
