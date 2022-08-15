<template>
  <div class="main">
    <div class="main__animes">
      <Suspense v-for="(i, index) in user_anime_data">
        <AnimeComponent
          :key="index"
          :animeId="i.anime.id"
          :animeImg="'https://shikimori.one/' + i.anime.image.original"
          :animeTitle="i.anime.name"
        ></AnimeComponent>

        <!-- <template #fallback> Loading... </template> -->
      </Suspense>
    </div>
  </div>
</template>

<script setup>
import AnimeComponent from "./AnimeComponent.vue";

async function getJSON(url) {
  const response = await fetch(url);
  return await response.json();
}

let nickname = "kolyazoloto";
let user_data = await getJSON(
  `https://shikimori.one/api/users/${nickname}?is_nickname=1`
);
let user_id = user_data.id;
let user_anime_data = await getJSON(
  `https://shikimori.one/api/users/${user_id}/anime_rates?limit=5000&status=watching`
);
</script>

<style scoped>
.main {
  padding: 8px;
  background-color: #efefef;
}
.main__animes {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
</style>
