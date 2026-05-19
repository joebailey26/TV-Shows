<style lang="scss" scoped>
.sort-controls {
  display: flex;
  gap: .5rem;
  align-items: center;
  justify-content: end;
  margin-top: 1rem;
  margin-bottom: 1rem
}
.sort-select {
  height: 2rem;
  padding: 0 .5rem;
  font-size: 1rem;
  border: none;
  border-radius: .5rem
}
.sort-order-btn {
  width: 2rem;
  height: 2rem;
  padding: 0;
  font-size: 1rem;
  background-color: var(--buttonBackgroundColor);
  border: none;
  border-radius: .5rem;
  cursor: pointer;
  transition: background-color .1s ease-in-out;
  &:hover {
    background-color: var(--buttonHoverBackgroundColor)
  }
}
</style>

<template>
  <main class="inner-content">
    <div class="sort-controls">
      <label for="watchingWith">Watching with:</label>
      <select id="watchingWith" class="sort-select" :value="route.query.watchingWith ?? 'all'" @change="changeWatchingWith">
        <option value="all">All</option>
        <option value="-1">Only me</option>
        <option v-for="partner in partners" :key="partner.id" :value="partner.id">Watching with {{ partner.name }}</option>
      </select>
      <label for="sort">Sort by:</label>
      <select id="sort" class="sort-select" :value="route.query.sort ?? 'alphabetical'" @change="changeSort">
        <option value="alphabetical">
          Alphabetical
        </option>
        <option value="episodesToWatch">
          Episodes to watch
        </option>
        <option value="nextEpisodeDate">
          Next episode date
        </option>
        <option value="firstEpisodeDate">
          First episode date
        </option>
      </select>
      <button type="button" class="sort-order-btn" @click="toggleOrder">
        {{ route.query.order === 'desc' ? '▼' : '▲' }}
      </button>
    </div>
    <Shows :shows="shows" :page-count="pages ?? 0" :delete-show-callback="deleteShowCallback" />
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  async setup () {
    definePageMeta({ middleware: 'auth' })
    const headers = import.meta.server ? useRequestHeaders(['cookie']) as HeadersInit : undefined

    const shows = ref([]) as Ref<EpisodateShowFromSearchTransformed[]>
    const pages = ref(0)
    const partners = ref<{id:number, name:string}[]>([])

    const route = useRoute()
    const router = useRouter()

    const category = Array.isArray(route.query.category)
      ? route.query.category[0]
      : route.query.category
    const sort = Array.isArray(route.query.sort)
      ? route.query.sort[0]
      : route.query.sort
    const order = Array.isArray(route.query.order)
      ? route.query.order[0]
      : route.query.order

    watch(() => [route.query.category, route.query.p, route.query.sort, route.query.order, route.query.watchingWith], async () => {
      const nuxtApp = useNuxtApp()
      nuxtApp.callHook('page:loading:start')
      const data = await $fetch('/api/shows', {
        headers,
        query: {
          showCategory: Array.isArray(route.query.category)
            ? route.query.category[0]
            : route.query.category,
          p: route.query.p,
          sort: Array.isArray(route.query.sort)
            ? route.query.sort[0]
            : route.query.sort,
          order: Array.isArray(route.query.order)
            ? route.query.order[0]
            : route.query.order,
          watchingWith: Array.isArray(route.query.watchingWith)
            ? route.query.watchingWith[0]
            : route.query.watchingWith
        }
      })
      shows.value = data.tv_shows ?? []
      pages.value = data.pages ?? 0
      nuxtApp.callHook('page:loading:end')
    })

    const deleteShowCallback = (id: number) => {
      const index = shows.value.findIndex(show => show.id === id)
      if (index !== -1) { shows.value.splice(index, 1) }
    }

    const changeSort = (event: Event) => {
      const value = (event.target as HTMLSelectElement).value
      router.push({ query: { ...route.query, sort: value, p: 1 } })
    }

    const changeWatchingWith = (event: Event) => {
      const value = (event.target as HTMLSelectElement).value
      router.push({ query: { ...route.query, watchingWith: value === 'all' ? undefined : value, p: 1 } })
    }

    const toggleOrder = () => {
      const newOrder = route.query.order === 'desc' ? 'asc' : 'desc'
      router.push({ query: { ...route.query, order: newOrder, p: 1 } })
    }

    const { data } = await useFetch('/api/shows', {
      headers,
      query: {
        showCategory: category,
        p: route.query.p,
        sort,
        order,
        watchingWith: Array.isArray(route.query.watchingWith)
          ? route.query.watchingWith[0]
          : route.query.watchingWith
      }
    })
    shows.value = data.value?.tv_shows ?? []
    pages.value = data.value?.pages ?? 0
    partners.value = await $fetch<{ id: number, name: string }[]>('/api/watch-partners' as string, { headers })

    return {
      shows,
      pages,
      deleteShowCallback,
      route,
      changeSort,
      toggleOrder,
      partners,
      changeWatchingWith
    }
  }
})
</script>
