<template>
  <UApp>
    <div>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
  </UApp>
</template>

<script setup lang="ts">
// Global app configuration
useHead({
  titleTemplate: '%s - MTG Commander League'
})
</script>
