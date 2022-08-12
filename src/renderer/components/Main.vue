<template>
  <div class="main">
    <Suspense>
      <!-- component with nested async dependencies -->
      <AnimeComponent></AnimeComponent>
      <!-- loading state via #fallback slot -->
      <template #fallback> Loading... </template>
    </Suspense>
  </div>
</template>

<script setup>
import AnimeComponent from "./AnimeComponent.vue";
</script>

<style scoped>
.main {
  padding: 1rem;
  background-color: #f3f3f3;
}
</style>
