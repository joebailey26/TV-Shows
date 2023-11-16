<style>
main {
  margin: 0 auto;
  padding: 1em;
  text-align: center
}
h1, h2 {
  text-align: left
}
h2 {
  margin: 0
}
.container {
  margin: 2rem 0
}
.shows_container {
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(auto-fit, 250px);
  justify-content: center
}
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
form {
  text-align: left
}
form * {
  display: inline
}

@media (min-width: 640px) {
  main {
    max-width: none
  }
}
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s
}
.fade-enter, .fade-leave-to {
  opacity: 0
}
</style>

<template>
  <main>
    <h1>TV Shows</h1>
    <div class="search_container container">
      <form @submit.prevent="search">
        <label for="search">
          <h2>Search for a show</h2>
          <div>
            <input v-model="searchData" type="text" name="search">
          </div>
        </label>
        <div><input type="submit" value="Search"></div>
      </form>
      <transition name="fade">
        <div v-if="searching" class="shows_container container">
          <div v-for="show in searchResults.tv_shows" :key="`searching_${show.id}`" :class="['show', showClassHelper(show.status, show.countdown)]">
            <h3>{{ show.name }}</h3>
            <p>Network: {{ show.network }}</p>
            <button type="button" class="button" @click="addShow(show.id)">
              Add
            </button>
          </div>
        </div>
      </transition>
    </div>
    <div style="text-align: left">
      <a class="button" :href="`/api/calendar`" target="_blank">Download calendar</a>
    </div>
    <h2>Currently Watching</h2>
    <div v-if="shows.length" class="shows_container container">
      <div v-for="show in shows" :key="show.id" :class="['show', showClassHelper(show.status, show.countdown)]">
        <h3>{{ show.name }}</h3>
        <p>
          Next episode:
          <span v-html="showCountdownHelper(show.countdown)" />
        </p>
        <p>Network: {{ show.network }}</p>
        <button type="button" class="button" @click="deleteShow(show.id)">
          Remove
        </button>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { useFetch } from 'nuxt/app'
import { defineComponent, reactive } from 'vue'

export default defineComponent({
  async setup () {
    const state = reactive({
      shows: [] as EpisodateShow[],
      searchData: '' as string,
      searchResults: {} as EpisodateSearch,
      searching: false as boolean
    })
    const { data } = await useFetch('/api/shows')

    state.shows = data as unknown as EpisodateShow[]

    return state
  },
  methods: {
    showClassHelper (status: string, countdown: EpisodateShowCountdown) {
      if (status === 'Canceled/Ended' || status === 'Ended') {
        return 'red'
      } else if (countdown !== null && countdown !== undefined) {
        return 'green'
      }
    },

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

    async search () {
      const searchRequest = await fetch(`https://www.episodate.com/api/search?q=${this.searchData}`, {
        method: 'POST'
      })
      this.searchResults = await searchRequest.json() as EpisodateSearch
      this.searchData = ''
      this.searching = true
    },

    async getShows () {
      // shows is set on the root. Populate it as part of this method
      this.shows = await fetch('api/shows').then((response) => {
        return response.json()
      })
    },

    async addShow (id: number) {
      const response = await fetch(`api/show/${id}`, {
        method: 'POST'
      })

      if (response.ok) {
        // You must search to add a show. Now the show is added, clear the searching state
        this.searching = false
        // Refresh getting shows
        this.getShows()
      }
    },

    async deleteShow (id: number) {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to delete this show?')) {
        const response = await fetch(`api/show/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          // Refresh getting shows
          this.getShows()
        }
      }
    }
  }
})
</script>
