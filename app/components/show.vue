<style lang="scss" scoped>
.show {
  position: relative;
  border: 1px solid transparent;
  box-shadow: 0 2px 5px 0 rgb(0 0 0 / 6%), 0 2px 10px 0 rgb(0 0 0 / 12%);
  cursor: initial;
  transition: ease-in .25s border-color;
  &.shouldGoToShow {
    cursor: pointer
  }
}
.show:hover,
.show:focus {
    border-color: #75ada1;

}
.show__image {
  display: block;
  width: 100%;
  height: 375px;
  object-fit: cover;
}
.show__description {
  position: absolute;
  bottom: 0;
  left: 0;
  display: grid;
  grid-gap: 1rem;
  width: 100%;
  height: fit-content;
  padding: 1.5rem .5rem;
  text-align: center;
  text-decoration: none;
  background-image: linear-gradient(0deg, rgb(0 0 0 / 90%) 0%, rgb(0 0 0 / 50%) 70%, rgb(0 0 0 / 0%) 100%);
  backdrop-filter: blur(2px);
  h3,
  p {
    margin: 0
  }
}
.show__status {
  justify-content: center
}
</style>

<template>
  <nuxt-link :class="['show', {'shouldGoToShow': computedShouldGoToShow}]" :href="computedShouldGoToShow ? `/show/${show.id}` : ''">
    <img class="show__image" :src="`/images?u=${encodeURIComponent(show.image_thumbnail_path?.replace('thumbnail', 'full') ?? 'https://placehold.co/250x600')}&w=250&h=375`" width="250" :loading="index < 10 ? 'eager' : 'lazy'">
    <div class="show__description">
      <h3>{{ show.name }}</h3>
      <Status v-if="show.status" :status="show.status" class="show__status" />
    </div>
    <ShowButtons
      :id="show.id"
      :is-tracked="show.tracked"
      :add-show-callback="addShowCallback"
      :delete-show-callback="deleteShowCallback"
    />
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
    },
    index: {
      type: Number,
      default: 0
    }
  },
  computed: {
    computedShouldGoToShow (): boolean {
      return this.shouldGoToShow || this.show.tracked
    }
  }
})
</script>
