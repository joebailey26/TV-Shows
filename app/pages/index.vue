<style lang="scss" scoped>
  header {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 100vh;
    padding: 4rem 1rem;
    background-image: linear-gradient(rgb(0 0 0 / 50%), rgb(0 0 0 / 50%)), url('https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?q=80&w=1920&auto=format&fit=crop');
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover
  }
  .header__title {
    margin: 1rem 0;
    font-size: 2em;
    font-weight: bold
  }
  .header__tagline {
    margin-top: -.5rem;
    font-weight: 500
  }
  .header__content {
    width: 100%;
    max-width: 600px;
    margin-top: -4rem;
    padding: 1.25rem 2rem;
    color: black;
    background: rgb(255 255 255 / 50%);
    border-radius: 1rem;
    backdrop-filter: blur(5px)
  }
  .sign-in {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 62px;
    padding: .75rem 1rem;
    color: var(--buttonColor);
    font-weight: 500;
    font-size: 1.1rem;
    background-color: var(--buttonBackgroundColor);
    border-color: rgb(0 0 0 / 10%);
    border-radius: .5rem;
    cursor: pointer;
    transition: all .1s ease-in-out;
    &:hover {
      background-color: var(--buttonHoverBackgroundColor)
    }
  }
  .privacy-policy {
    display: inline-block;
    margin-top: 1rem;
    text-decoration: none;
    &:hover {
      text-decoration: underline
    }
  }
</style>

<template>
  <header>
    <div class="inner-content">
      <div class="header__content">
        <h1 class="header__title">TV Shows</h1>
        <p class="header__tagline">Manage your TV shows in one place.</p>
        <p>TV Shows is an app for tracking your favorite television series, browsing upcoming episodes, managing a personal watchlist, and optionally syncing episode dates to your calendar.</p>
        <button type="button" class="sign-in button" @click="signIn()">
          Sign Up / Sign In
        </button>
        <a class="privacy-policy" :href="privacyPolicyUrl">Privacy Policy</a>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
export default defineComponent({
  setup () {
    definePageMeta({ middleware: 'guest-only', layout: false })

    const { signIn } = useAuth()
    const config = useRuntimeConfig()
    const baseUrl = config.public.authJs.baseUrl.replace(/\/$/, '')
    const privacyPolicyUrl = baseUrl ? `${baseUrl}/privacy-policy` : '/privacy-policy'

    useHead({
      title: 'TV Shows',
      meta: [
        { name: 'application-name', content: 'TV Shows' },
        { name: 'description', content: 'TV Shows is an app for tracking television series, browsing upcoming episodes, managing a personal watchlist, and syncing episode dates to a calendar.' },
        { property: 'og:site_name', content: 'TV Shows' },
        { property: 'og:title', content: 'TV Shows' },
        { property: 'og:description', content: 'Track television series, browse upcoming episodes, manage a personal watchlist, and sync episode dates to a calendar.' }
      ],
      link: [
        { rel: 'canonical', href: baseUrl || '/' },
        { rel: 'privacy-policy', href: privacyPolicyUrl }
      ]
    })

    return { privacyPolicyUrl, signIn }
  }
})
</script>
