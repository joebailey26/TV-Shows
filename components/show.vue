<style lang="scss" scoped>
.show {
  padding: 1rem;
  border: 1px solid black
}
.show.red {
  color: white;
  background-color: darkred
}
.show.green {
  color: white;
  background-color: darkgreen
}
</style>

<template>
  <div :class="['show', showClassHelper(show.status, show.countdown)]">
    <h3>{{ show.name }}</h3>
    <p>
      Next episode:
      <span v-html="showCountdownHelper(show.countdown)" />
    </p>
    <p>Network: {{ show.network }}</p>
    <button v-if="!getShowById(show.id)" type="button" class="button" @click="addShow(show.id)">
      Add
    </button>
    <button v-else type="button" class="button" @click="deleteShow(show.id)">
      Remove
    </button>
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
    showClassHelper (status: string, countdown: EpisodateShowCountdown) {
      if (status === 'Canceled/Ended' || status === 'Ended') {
        return 'red'
      } else if (countdown !== null && countdown !== undefined) {
        return 'green'
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
