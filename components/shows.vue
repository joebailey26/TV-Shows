<style lang="scss" scoped>
.shows_container {
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(auto-fit, 250px);
  margin: 2rem 0
}
</style>

<template>
  <transition name="fade">
    <div v-if="Array.isArray(shows?.tv_shows) && shows.tv_shows.length" class="shows_container">
      <Show
        v-for="show in shows.tv_shows"
        :key="show.id"
        :show="show"
        :remove-show-callback="removeShowCallback"
        :add-show-callback="addShowCallback"
      />
      <!-- <Pagination /> -->
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    shows: {
      type: {} as EpisodateSearch,
      default: () => []
    },
    addShowCallback: {
      type: Function,
      default: () => {}
    },
    removeShowCallback: {
      type: Function,
      default: () => {}
    }
  }
})
</script>
