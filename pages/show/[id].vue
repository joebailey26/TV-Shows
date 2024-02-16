<style lang="scss" scoped>
h1 {
  margin-top: 0
}
.header {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  padding-top: 2rem;
  img {
    display: block;
    width: 100%;
    max-width: 350px;
    height: auto;
    max-height: 490px;
    object-fit: cover;
    aspect-ratio: 3/4.2
  }
}
.info {
  display: grid;
  gap: 1rem
}
.image-wrapper {
  position: relative;
  .countdown {
    position: absolute;
    inset: 0;
    margin-top: 0
  }
}
@media (min-width: 768px) {
  .header {
    grid-template-columns: 350px 1fr
  }
  .image-wrapper {
    grid-row: span 2
  }
  .episodes {
    grid-column: 2
  }
}
</style>

<template>
  <div class="inner-content">
    <div class="header">
      <div class="image-wrapper">
        <img :src="`/images?u=${encodeURIComponent(image_path ?? image_thumbnail_path?.replace('thumbnail', 'full') ?? 'https://placehold.co/250x600')}&w=350&h=490`" width="350" height="490" loading="eager">
        <GalexiaDate
          v-if="countdown"
          class="countdown"
          :date="new Date(countdown.air_date)"
          day-text-color="#ffffff"
          day-background-color="#000000"
          month-year-text-color="#ffffff"
          month-year-background-color="#333333"
        />
      </div>
      <div class="content">
        <h1 v-html="name" />
        <p v-html="description" />
        <div class="info">
          <span v-if="network">Network: {{ network }}</span>
          <span v-if="runtime">Average Runtime: {{ runtime }} minutes</span>
          <span v-if="start_date">Start Date: <PrettyDate :date="new Date(start_date)" /></span>
          <span v-if="countdown?.air_date">Next Episode Date: <PrettyDate :date="new Date(countdown.air_date)" /></span>
          <Status v-if="status" :status="status" />
        </div>
      </div>
      <div class="episodes">
        <h2>
          Episodes:
        </h2>
        <div v-for="season in seasons" :key="season.season">
          Season {{ season.season }}
          <div v-for="episode in season.episodes" :key="`${episode.id}-${episode.watched}`">
            <Episode v-if="episode.episode" :episode="episode" :set-episode-callback="updateShow" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import GalexiaDate from 'nuxt-component-date/index.vue'

interface Season {
  season: number;
  episodes: EpisodesTransformed[];
}

export default defineComponent({
  components: {
    GalexiaDate
  },
  async setup () {
    const headers = useRequestHeaders(['cookie']) as HeadersInit
    definePageMeta({ middleware: 'auth' })
    const route = useRoute()
    if (Array.isArray(route.params.id)) {
      route.params.id = route.params.id[0]
    }
    const showId = parseInt(route.params.id)
    const show = ref(null) as Ref<EpisodateShowTransformed|null>

    const response = await useFetch(`/api/show/${showId}`, {
      headers
    })

    if (response.data.value) {
      show.value = reactive(response.data.value)
    } else {
      throw createError({ statusCode: 404, message: 'Page not found' })
    }

    const seasons: ComputedRef<Season[]> = computed(() => {
      if (show.value && show.value.episodes.length > 0) {
        const seasons = show.value.episodes.reduce((acc: Record<number, EpisodesTransformed[]>, episode) => {
          const seasonNumber = episode.season
          if (!acc[seasonNumber]) {
            acc[seasonNumber] = []
          }
          acc[seasonNumber].push(episode)
          return acc
        }, {})

        return Object.keys(seasons).map(season => ({
          season: parseInt(season, 10),
          episodes: seasons[parseInt(season, 10)]
        }))
      }
      return []
    })

    async function updateShow (episode: Number) {
      const response = await useFetch(`/api/show/${showId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          episode
        })
      })

      const watchedEpisodes = response.data.value

      if (show.value && watchedEpisodes) {
        show.value.episodes.forEach((episode) => {
          if (watchedEpisodes.find(watchedEpisode => watchedEpisode === episode.id)) {
            episode.watched = true
          } else {
            episode.watched = false
          }
        })
      }
    }

    return {
      ...toRefs(show.value),
      updateShow,
      seasons
    }
  }
})
</script>
