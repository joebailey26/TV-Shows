<style lang="scss" scoped>
button {
  padding: 0;
  text-align: left;
  background: none;
  border: none;
  border-radius: 0;
  cursor: pointer;
}
.watched {
  color: var(--greenColor)
}
</style>

<template>
  <button type="button" :class="{watched: episode.watched}" @click="setEpisodeCallback(episode.id)">
    <span v-html="`S${episode.season.toString().padStart(2, '0')}E${episode.episode.toString().padStart(2, '0')}`" />
    <span v-html="` - ${episode.name} - `" />
    <PrettyDate :date="new Date(episode.air_date)" />
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    episode: {
      type: Object as PropType<EpisodesTransformed>,
      required: true
    },
    setEpisodeCallback: {
      type: Function,
      default: () => {}
    }
  }
})
</script>
