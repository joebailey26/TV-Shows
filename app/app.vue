<template>
  <div>
    <NuxtLoadingIndicator color="#2BD2FF" :throttle="1" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ConfirmDialog />
  </div>
</template>
