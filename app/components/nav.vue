<style lang="scss" scoped>
nav {
  position: sticky;
  top: 0;
  z-index: 9999;
  min-height: 4.4375rem;
  padding: .75rem 0;
  color: white;
  background-color: rgb(0 0 0 / 40%);
  backdrop-filter: blur(5px)
}
.inner-content,
.left,
.right {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between
}
.menu {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  width: 100%
}
.nav-search {
  width: fit-content;
  margin-left: auto
}
.mobile-toggle {
  display: none;
  color: inherit;
  font-size: 1.5rem;
  background: none;
  border: none;
  cursor: pointer
}

@media (max-width: 768px) {
  nav {
    min-height: 0
  }
  .mobile-toggle {
    display: block;
    margin-top: -2px
  }
  .menu {
    display: none;
    flex-direction: column;
    align-items: stretch;
    order: 2;
    width: 100%;
    &.open {
      display: flex
    }
  }
  .left,
  .right {
    flex-direction: column;
    align-items: stretch;
    width: 100%
  }
  .nav-search {
    order: 1;
    margin-left: 0
  }
}
.nav-link {
  font-size: 1.1rem;
  text-decoration: none
}
.button {
  min-height: 0
}
</style>

<template>
  <nav>
    <div class="inner-content">
      <button class="mobile-toggle" type="button" @click="isMenuOpen = !isMenuOpen">
        ☰
      </button>
      <div :class="['menu', { open: isMenuOpen }]">
        <div class="left">
          <nuxt-link to="/my-shows" class="nav-link">
            All Shows
          </nuxt-link>
          <nuxt-link to="/my-shows?category=toCatchUpOn" class="nav-link">
            To Catch Up On
          </nuxt-link>
          <nuxt-link to="/my-shows?category=wantToWatch" class="nav-link">
            Want To Watch
          </nuxt-link>
          <nuxt-link to="/my-shows?category=waitingFor" class="nav-link">
            Waiting For
          </nuxt-link>
          <nuxt-link to="/my-shows?category=cancelled" class="nav-link">
            Cancelled
          </nuxt-link>
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
      <div class="nav-search">
        <Search />
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
      userEmail: '',
      isMenuOpen: false
    })

    if (user.value?.email) {
      state.userEmail = user.value.email
    }

    return state
  }
})
</script>
