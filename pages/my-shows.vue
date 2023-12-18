<template>
  <main class="inner-content">
    <h2>Currently Watching</h2>
    <Shows :shows="shows.tv_shows" :page-count="shows.pages" />
  </main>
</template>

<script lang="ts">
import { mapState } from 'pinia'
import { defineComponent } from 'vue'
import { useShowsStore } from '../stores/shows'

export default defineComponent({
  setup () {
    definePageMeta({ middleware: 'auth' })
  },
  computed: {
    ...mapState(useShowsStore, ['shows'])
  }
})
</script>
