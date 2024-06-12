<template>
  <time :datetime="date.toISOString().split('T')[0]" v-text="new Intl.DateTimeFormat('en-GB', { dateStyle: 'full' }).format(date)" />
</template>
<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    date: {
      type: Date,
      required: true
    }
  }
})
</script>
