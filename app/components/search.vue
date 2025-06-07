<style lang="scss" scoped>
.search__form {
  position: relative;
  width: fit-content
}
.search__input {
  height: 2rem;
  padding: 0 .5rem;
  font-size: 1.1rem;
  border: none;
  border-radius: 2rem
}
.search__button {
  position: absolute;
  right: 8px;
  width: 1rem;
  height: 100%;
  background-color: transparent;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='16' width='16' viewBox='0 0 512 512' style='fill: var(--buttonBackgroundColor)'%3E%3Cpath d='M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  border: none;
  cursor: pointer
}
.searched_shows {
  position: fixed;
  top: 4.4375rem;
  left: 0;
  width: 100%;
  background-color: rgb(0 0 0 / 40%);
  backdrop-filter: blur(5px)
}
.shows_container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem
}
</style>

<template>
  <form class="search__form" action="/search">
    <input type="text" name="q" :value="route.query.q" placeholder="Search TV Show..." class="search__input">
    <button type="submit" class="search__button" />
  </form>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  setup () {
    const route = useRoute()

    return { route }
  }
})
</script>
