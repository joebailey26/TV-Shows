<style lang="scss" scoped>
.show {
  position: relative;
  display: grid;
  grid-gap: .5rem;
  padding: 1rem;
  color: var(--bodyTextColor);
  background-color: var(--whiteColor);
  box-shadow: 0 2px 5px 0 rgb(0 0 0 / 6%), 0 2px 10px 0 rgb(0 0 0 / 12%);
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
.status {
  display: flex;
  align-items: center;
  justify-content: center
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
.status__ended:before {
  background-color: var(--redColor)
}
.status__running:before {
  background-color: var(--greenColor)
}
.show:hover .button {
  opacity: 1
}
.button {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: rgb(0 0 0 / 50%);
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity .25s ease-in;
  &:after {
    display: block;
    width: 3em;
    height: 3em;
    margin-top: -2em;
    background-repeat: no-repeat;
    background-position: 47% 50%;
    background-size: 35%;
    border-radius: 50%;
    content: '';
    &:hover {
      opacity: .75
    }
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
  <div class="show">
    <img :src="show.image_path" width="250" loading="lazy">
    <h3>{{ show.name }}</h3>
    <p :class="['status', `status__${show.status.toLowerCase().replaceAll('/', '-')}`]">
      Status: {{ show.status }}
    </p>
    <p v-if="show.status !== 'Canceled/Ended' && show.status !== 'Ended'" class="next-episode">
      Next episode:
      <span v-html="showCountdownHelper(show.countdown)" />
    </p>
    <p>Network: {{ show.network }}</p>
    <a v-if="!getShowById(show.id)" href="javascript:void(0)" class="button add" @click="addShow(show.id)" />
    <a v-else href="javascript:void(0)" class="button remove" @click="deleteShow(show.id)" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, storeToRefs } from 'pinia'
import { useShowsStore } from '../stores/shows'

export default defineComponent({
  props: {
    show: {
      type: Object,
      required: true
    },
    addShowCallback: {
      type: Function,
      default: () => {}
    },
    removeShowCallback: {
      type: Function,
      default: () => {}
    }
  },
  setup () {
    const showsStore = useShowsStore()
    const { getShowById } = storeToRefs(showsStore)

    return {
      getShowById
    }
  },
  methods: {
    ...mapActions(useShowsStore, ['fetchShows']),
    showCountdownHelper (countdown: EpisodateShowCountdown) {
      if (countdown == null) {
        return 'Unknown'
      } else {
        const date = new Date(countdown.air_date)
        const day = date.getDate()
        const monthArr = []
        monthArr[0] = 'Jan'
        monthArr[1] = 'Feb'
        monthArr[2] = 'Mar'
        monthArr[3] = 'Apr'
        monthArr[4] = 'May'
        monthArr[5] = 'Jun'
        monthArr[6] = 'Jul'
        monthArr[7] = 'Aug'
        monthArr[8] = 'Sep'
        monthArr[9] = 'Oct'
        monthArr[10] = 'Nov'
        monthArr[11] = 'Dec'
        const month = monthArr[date.getMonth()]
        const year = date.getFullYear().toString().substring(2)

        return `<time datetime=${date}>${day} ${month} '${year}</time>`
      }
    },
    async addShow (id: number) {
      const headers = useRequestHeaders(['cookie']) as HeadersInit
      const response = await fetch(`api/show/${id}`, {
        method: 'POST',
        headers
      })

      if (response.ok) {
        this.fetchShows()
        if (this.addShowCallback) {
          this.addShowCallback()
        }
      }
    },
    async deleteShow (id: number) {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to delete this show?')) {
        const headers = useRequestHeaders(['cookie']) as HeadersInit
        const response = await fetch(`api/show/${id}`, {
          method: 'DELETE',
          headers
        })

        if (response.ok) {
          this.fetchShows()
          if (this.removeShowCallback) {
            this.removeShowCallback()
          }
        }
      }
    }
  }
})
</script>
