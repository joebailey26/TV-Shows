<template>
  <div>
    <Nav />
    <slot />
    <Footer />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useShowsStore } from '../stores/shows'

definePageMeta({ middleware: 'auth' })

export default defineComponent({
  async setup () {
    const store = useShowsStore()
    await store.fetchShows()
  }
})
</script>
