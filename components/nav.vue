<style lang="scss" scoped>
nav {
  position: sticky;
  top: 0;
  z-index: 9999;
  height: 4.4375rem;
  padding: .75rem 0;
  color: white;
  background-color: rgb(0 0 0 / 40%);
  backdrop-filter: blur(5px)
}
.inner-content,
.left,
.right {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between
}
.site-title {
  font-size: 1.5rem;
  text-decoration: none
}
.button {
  min-height: 0
}
</style>

<template>
  <nav>
    <div class="inner-content">
      <div class="left">
        <a href="/my-shows" class="site-title">TV Shows</a>
        <Search />
      </div>
      <div class="right">
        <a class="download-calendar button" :href="`/api/calendar/${userEmail}`" :download="`tv_joebailey_xyz_calendar_${userEmail}`">
          Download calendar
        </a>
        <a class="sign-out button" href="/api/auth/signout">
          Sign Out
        </a>
      </div>
    </div>
  </nav>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue'

export default defineComponent({
  setup () {
    const { user } = useAuth()

    const state = reactive({
      userEmail: ''
    })

    if (user.value?.email) {
      state.userEmail = user.value.email
    }

    return state
  }
})
</script>
