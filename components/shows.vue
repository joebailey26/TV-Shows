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
        :remove-show-callback="removeShowCallback"
        :add-show-callback="addShowCallback"
      />
      <Pagination :page-count="pageCount" />
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    shows: {
      type: Array as PropType<EpisodateShow[]>,
      default: () => []
    },
    addShowCallback: {
      type: Function,
      default: () => {}
    },
    removeShowCallback: {
      type: Function,
      default: () => {}
    },
    pageCount: {
      type: Number,
      required: true
    }
  }
})
</script>
