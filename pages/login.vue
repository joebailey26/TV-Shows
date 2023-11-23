<template>
  <div>
    <div>
      <button @click="signIn()">
        JS Sign In
      </button>
    </div>
  </div>
</template>

<script lang="ts">
definePageMeta({ middleware: 'guest-only' })
</script>
<script setup lang="ts">
const { signIn } = useAuth()
</script>
