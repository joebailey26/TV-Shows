<template>
  <div>
    <NuxtLoadingIndicator color="#A78BFA" :throttle="1" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ConfirmDialog />
  </div>
</template>
