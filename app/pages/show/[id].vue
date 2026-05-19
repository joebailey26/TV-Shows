<style lang="scss" scoped>
h1 {
  margin-top: 0;
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
    aspect-ratio: 3/4.2;
  }
}
.info {
  display: grid;
  gap: 1rem;
}
.watching-with {
  display: grid;
  gap: 0.5rem;

  label {
    font-weight: 600;
    color: #fff;
  }

  .watching-with-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;

    p {
      margin: 0;
    }
  }

  .clear-button {
    border: none;
    background: transparent;
    color: var(--primaryColor);
    font: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0;

    &:disabled {
      color: #777;
      cursor: not-allowed;
    }
  }

  .watching-with-help {
    margin: 0;
    color: #d1d5db;
    font-size: 0.9rem;
  }

  .partner-options {
    display: grid;
    gap: 0.5rem;
  }

  .partner-option {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    border: 1px solid #3a3a3a;
    border-radius: 0.5rem;
    background: #2a2a2a;
    color: #f3f4f6;
    padding: 0.55rem 0.7rem;
    font-weight: 500;
    cursor: pointer;

    input {
      margin: 0;
      width: 1rem;
      height: 1rem;
      accent-color: var(--buttonBackgroundColor);
      cursor: pointer;
    }

    &:focus-within {
      border-color: var(--buttonBackgroundColor);
      box-shadow: 0 0 0 2px rgb(124 58 237 / 0.3);
    }
  }

}
.image-wrapper {
  position: relative;
  width: fit-content;
  .countdown {
    position: absolute;
    inset: 0;
    z-index: 3;
    margin-top: 0;
  }
}
@media (min-width: 768px) {
  .header {
    grid-template-columns: 350px 1fr;
  }
  .image-wrapper {
    grid-row: span 2;
  }
  .episodes {
    grid-column: 2;
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
        <ShowButtons
          :id="id"
          :is-tracked="tracked"
          :delete-show-callback="deleteShowCallback"
        />
      </div>
      <div class="content">
        <h1 v-html="name" />
        <p v-html="description" />
        <div class="info">
          <div class="watching-with">
            <div class="watching-with-header">
              <p>Watching together with:</p>
              <button
                type="button"
                class="clear-button"
                :disabled="selectedPartners.length === 0"
                @click="clearWatchingWith"
              >
                Clear all
              </button>
            </div>
            <p class="watching-with-help">
              Select one or more people.
            </p>
            <div class="partner-options">
              <label
                v-for="partner in partners"
                :key="partner.id"
                class="partner-option"
                :for="`watchingWith-${partner.id}`"
              >
                <input
                  :id="`watchingWith-${partner.id}`"
                  type="checkbox"
                  :checked="selectedPartners.includes(partner.id)"
                  @change="updateWatchingWith(partner.id, $event)"
                >
                <span>{{ partner.name }}</span>
              </label>
            </div>
          </div>
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
    const router = useRouter()
    const headers = useRequestHeaders(['cookie']) as HeadersInit
    definePageMeta({ middleware: 'auth' })
    const route = useRoute()
    const idParam = (
      Array.isArray(route.params.id)
        ? route.params.id[0]
        : route.params.id
    ) as string
    const showId = parseInt(idParam)
    const show = ref(null) as Ref<EpisodateShowTransformed|null>
    const partners = ref<{id:number, name:string}[]>([])
    const selectedPartners = ref<number[]>([])

    const response = await useFetch(`/api/show/${showId}`, {
      headers
    })

    if (response.data.value) {
      show.value = reactive(response.data.value)
      selectedPartners.value = (response.data.value.watchingWith ?? []).map((item: { id: number }) => item.id)
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
          episodes: seasons[parseInt(season, 10)]!
        }))
      }
      return []
    })

    async function saveWatchingWith (watchPartnerIds: number[]) {
      await $fetch(`/api/show/${showId}`, { method: 'PATCH', headers, body: { watchPartnerIds } })
    }

    async function updateWatchingWith (partnerId: number, event: Event) {
      const target = event.target as HTMLInputElement
      const selectedSet = new Set(selectedPartners.value)

      if (target.checked) {
        selectedSet.add(partnerId)
      } else {
        selectedSet.delete(partnerId)
      }

      const watchPartnerIds = Array.from(selectedSet)
      selectedPartners.value = watchPartnerIds
      await saveWatchingWith(watchPartnerIds)
    }

    async function clearWatchingWith () {
      selectedPartners.value = []
      await saveWatchingWith([])
    }

    async function updateShow (episode: number) {
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

    partners.value = await $fetch('/api/watch-partners', { headers })

    const deleteShowCallback = () => {
      router.push('/my-shows')
    }

    return {
      ...toRefs(show.value),
      updateShow,
      seasons,
      deleteShowCallback,
      partners,
      selectedPartners,
      updateWatchingWith,
      clearWatchingWith
    }
  }
})
</script>
