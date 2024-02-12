<style lang="scss" scoped>
.show {
  position: relative;
  display: grid;
  grid-gap: .5rem;
  padding: 1rem;
  color: var(--bodyTextColor);
  text-align: center;
  text-decoration: none;
  background-color: var(--whiteColor);
  box-shadow: 0 2px 5px 0 rgb(0 0 0 / 6%), 0 2px 10px 0 rgb(0 0 0 / 12%);
  cursor: initial;
  &.shouldGoToShow {
    cursor: pointer
  }
  img {
    width: calc(100% + 2rem);
    height: 375px;
    margin: -1rem -1rem 0;
    object-fit: cover;
    @media (max-width: 564px) {
      display: none
    }
  }
  h3,
  p {
    margin: 0
  }
}
.show__status {
  justify-content: center
}
.button {
  position: absolute;
  z-index: 2;
  width: 2.5rem;
  height: 2.5rem;
  min-height: 0;
  margin: 0;
  padding: 0;
  background: none;
  border: none;
  border-radius: 0;
  &:after {
    display: block;
    width: 100%;
    height: 100%;
    background-repeat: no-repeat;
    background-position: center;
    background-size: 35%;
    cursor: pointer;
    content: ''
  }
  &.add:after {
    background-color: var(--greenColor);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='16' width='14' viewBox='0 0 448 512' style='fill: white'%3E%3Cpath d='M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z'/%3E%3C/svg%3E")
  }
  &.remove:after {
    background-color: var(--redColor);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='16' width='14' viewBox='0 0 448 512' style='fill: white'%3E%3Cpath d='M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z'/%3E%3C/svg%3E")
  }
}
</style>

<template>
  <nuxt-link :class="['show', {'shouldGoToShow': shouldGoToShow}]" :href="shouldGoToShow ? `/show/${show.id}` : '#'">
    <img :src="`/images?u=${encodeURIComponent(show.image_thumbnail_path?.replace('thumbnail', 'full') ?? 'https://placehold.co/250x600')}&w=250&h=375`" width="250" loading="lazy">
    <h3>{{ show.name }}</h3>
    <Status v-if="show.status" :status="show.status" class="show__status" />
    <button v-if="!show.tracked" type="button" class="button add" @click.stop="addShow(show.id)" />
    <button v-else type="button" class="button remove" @click.stop="deleteShow(show.id)" />
  </nuxt-link>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    show: {
      type: Object as PropType<EpisodateShowFromSearchTransformed>,
      required: true
    },
    addShowCallback: {
      type: Function as PropType<ShowCallback>,
      default: () => {}
    },
    deleteShowCallback: {
      type: Function as PropType<ShowCallback>,
      default: () => {}
    },
    shouldGoToShow: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    async addShow (id: number) {
      const headers = useRequestHeaders(['cookie']) as HeadersInit
      const response = await fetch(`/api/show/${id}`, {
        method: 'POST',
        headers
      })

      if (response.ok) {
        if (typeof this.addShowCallback === 'function') {
          this.addShowCallback(id)
        }
      }
    },
    async deleteShow (id: number) {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to delete this show?')) {
        const headers = useRequestHeaders(['cookie']) as HeadersInit
        const response = await fetch(`/api/show/${id}`, {
          method: 'DELETE',
          headers
        })

        if (response.ok) {
          if (typeof this.deleteShowCallback === 'function') {
            this.deleteShowCallback(id)
          }
        }
      }
    }
  }
})
</script>
