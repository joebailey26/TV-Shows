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
    color: white;
    font-weight: 600;
  }
  .watching-with-header {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    p {
      margin: 0;
    }
  }
  .clear-button {
    padding: 0;
    color: var(--primaryColor);
    font: inherit;
    font-weight: 600;
    font-size: 0.9rem;
    background: transparent;
    border: none;
    cursor: pointer;
    &:disabled {
      color: #777777;
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
    gap: 0.6rem;
    align-items: center;
    padding: 0.55rem 0.7rem;
    color: #f3f4f6;
    font-weight: 500;
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 0.5rem;
    cursor: pointer;
    input {
      width: 1rem;
      height: 1rem;
      margin: 0;
      cursor: pointer;
      accent-color: var(--buttonBackgroundColor);
    }
    &:focus-within {
      border-color: var(--buttonBackgroundColor);
      box-shadow: 0 0 0 2px rgb(124 58 237 / 30%);
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
@media (width >= 768px) {
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
    const headers = import.meta.server ? useRequestHeaders(['cookie']) as HeadersInit : undefined
    definePageMeta({ middleware: 'auth' })
    const route = useRoute()
    const idParam = (
      Array.isArray(route.params.id)
        ? route.params.id[0]
        : route.params.id
    ) as string
    const showId = parseInt(idParam)
    const show = ref<EpisodateShowTransformed | null>(null)
    const partners = ref<{id:number, name:string}[]>([])
    const selectedPartners = ref<number[]>([])

    const response = await useFetch<EpisodateShowTransformed | null>(`/api/show/${showId}` as string, {
      headers
    })

    if (!response.data.value) {
      throw createError({ statusCode: 404, message: 'Page not found' })
    }

    const showState = reactive(response.data.value) as EpisodateShowTransformed
    show.value = showState
    selectedPartners.value = showState.watchingWith.map(item => item.id)

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
      await $fetch<{ success: boolean, watchedEpisodeIds: number[] }>(`/api/show/${showId}` as string, { method: 'PATCH', headers, body: { watchPartnerIds } })
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
      const response = await useFetch<{ success: boolean, watchedEpisodeIds: number[] }>(`/api/show/${showId}` as string, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          episode
        })
      })

      const watchedEpisodeIds = response.data.value?.watchedEpisodeIds

      if (show.value && watchedEpisodeIds) {
        show.value.episodes.forEach((episode) => {
          if (watchedEpisodeIds.find(watchedEpisode => watchedEpisode === episode.id)) {
            episode.watched = true
          } else {
            episode.watched = false
          }
        })
      }
    }

    const { data: partnerData } = await useFetch<WatchPartner[]>('/api/watch-partners' as string, { headers })
    partners.value = partnerData.value ?? []

    const deleteShowCallback = () => {
      router.push('/my-shows')
    }

    return {
      ...toRefs(showState),
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
