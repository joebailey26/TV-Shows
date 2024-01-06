<style lang="scss" scoped>
button {
  padding: 0;
  background: none;
  border: none;
  border-radius: 0;
  cursor: pointer
}
</style>

<template>
  <button type="button" @click="setEpisodeCallback(episode)">
    <span v-html="`S${episode.season.toString().padStart(2, '0')}E${episode.episode.toString().padStart(2, '0')} - ${episode.name}`" />
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    episode: {
      type: Object as PropType<EpisodateShowEpisode>,
      required: true
    },
    setEpisodeCallback: {
      type: Function,
      default: () => {}
    }
  }
})
</script>
