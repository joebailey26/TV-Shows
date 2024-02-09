<style lang="scss" scoped>
.shows_container {
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(auto-fit, 250px);
  margin: 2rem 0
}
.pagination {
  grid-column: 1/-1
}
</style>

<template>
  <transition name="fade">
    <div v-if="Array.isArray(shows) && shows.length" class="shows_container">
      <Show
        v-for="show in shows"
        :key="show.id"
        :show="show"
        :delete-show-callback="deleteShowCallback"
        :add-show-callback="addShowCallback"
        :should-go-to-show="shouldGoToShow"
      />
      <GalexiaPagination
        :page-count="pageCount"
        :current-page="currentPage"
        :go-to-page="goToPage"
      />
    </div>
  </transition>
</template>

<script lang="ts">
import GalexiaPagination from 'nuxt-component-pagination'
import { defineComponent } from 'vue'

export default defineComponent({
  components: {
    GalexiaPagination
  },
  props: {
    shows: {
      type: Array as PropType<EpisodateShowFromSearchTransformed[]>,
      default: () => []
    },
    addShowCallback: {
      type: Function as PropType<ShowCallback>,
      default: () => {}
    },
    deleteShowCallback: {
      type: Function as PropType<ShowCallback>,
      default: () => {}
    },
    pageCount: {
      type: Number,
      required: true
    },
    shouldGoToShow: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    currentPage () {
      const p = this.$route.query.p
      const page = Array.isArray(p) ? p[0] : p
      return page ? parseInt(page) : 1
    }
  },
  methods: {
    goToPage (page: Number) {
      this.$router.push({ path: this.$route.path, query: { ...this.$route.query, p: page.toString() } })
    }
  }
})
</script>
