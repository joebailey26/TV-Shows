<style lang="scss" scoped>
  header {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 100vh;
    padding: 4rem 1rem;
    background-image: linear-gradient(rgb(0 0 0 / 50%), rgb(0 0 0 / 50%)), url('/unauthenticated-header.jpg');
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover
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
</style>

<template>
  <header>
    <div class="inner-content">
      <div class="header__content">
        <h1>Manage your TV Shows</h1>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec rutrum neque et mi convallis tincidunt sit amet finibus velit. Donec tempus eros semper, venenatis erat ac, feugiat mauris. Cras lobortis orci nec quam iaculis vulputate. Mauris lectus nulla, blandit ut imperdiet at, euismod in purus.</p>
        <button type="button" class="sign-in button" @click="signIn()">
          Sign Up / Sign In
        </button>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
export default defineComponent({
  setup () {
    definePageMeta({ middleware: 'guest-only', layout: false })

    const { signIn } = useAuth()

    return { signIn }
  }
})
</script>
