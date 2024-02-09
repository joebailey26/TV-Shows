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
.image-wrapper {
  position: relative;
  .countdown {
    position: absolute;
    inset: 0;
    margin-top: 0
  }
}
@media (min-width: 768px) {
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
      <!-- ToDo: Componentize show so we can use it both in the small component and this full page one. For example, status. -->
      <div class="image-wrapper">
        <img :src="image_path ?? image_thumbnail_path?.replace('thumbnail', 'full') ?? 'https://placehold.co/250x600'" width="250">
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
        </div>
      </div>
      <div class="episodes">
        <h2>
          Episodes:
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
import GalexiaDate from 'nuxt-component-date/index.vue'

interface Season {
  season: number;
  episodes: Episodes[];
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
    const response = await useFetch(`/api/show/${showId}`, {
      headers,
      // We use pick here to minimise the payload of the show that is cached
      // If we add a property to the dom, then we need to add it here too
      pick: [
        'image_path',
        'image_thumbnail_path',
        'name',
        'description',
        'network',
        'runtime',
        'start_date',
        'episodes',
        'countdown'
      ]
    })

    let show = response.data.value

    if (!show?.name) {
      throw createError({ statusCode: 404, message: 'Page not found' })
    }

    const seasons: ComputedRef<Season[]> = computed(() => {
      if (show && show.episodes.length > 0) {
        const seasons = show.episodes.reduce((acc: Record<number, EpisodesTransformed[]>, episode: EpisodesTransformed) => {
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
      show = response.data.value
    }

    return {
      ...toRefs(show),
      updateShow,
      seasons
    }
  }
})
</script>
