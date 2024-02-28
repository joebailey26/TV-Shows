<style lang="scss" scoped>
.status {
  display: flex;
  align-items: center
}
.status:before {
  display: block;
  width: 1em;
  height: 1em;
  margin-right: .5em;
  background-color: var(--yellowColor);
  border-radius: 50%;
  content: ''
}
.status__canceled-ended:before,
.status__canceled:before,
.status__ended:before {
  background-color: var(--redColor)
}
.status__running:before {
  background-color: var(--greenColor)
}
</style>

<template>
  <span :class="['status', `status__${status.toLowerCase().replaceAll('/', '-')}`]">
    Status: {{ status }}
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    status: {
      type: String,
      required: true
    }
  }
})
</script>
