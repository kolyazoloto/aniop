<template>
  <div class="main">
    <vue-final-modal class="vue-final-modal" v-model="showModalUpdateAvailable">
      <div class="modal">
        Update available
        <button @click="showModalUpdateAvailable = false">Ok</button>
      </div>
    </vue-final-modal>

    <vue-final-modal
      class="vue-final-modal"
      v-model="showModalUpdateDownloaded"
    >
      <div class="modal">
        Update downloaded!!!
        <button @click="sendInstallUpdate">Install</button>
        <button @click="showModalUpdateDownloaded = false">Later</button>
      </div>
    </vue-final-modal>

    <div class="main__left">
      <div class="main__user" :class="{ disable: downloadAllActive }">
        <div class="main__user-data" v-if="user_data != null">
          <img class="main__user-img" :src="user_data.avatar" />
          <div class="main__user-info">
            <p class="main__user-nickname">{{ user_data.nickname }}</p>
            <p class="main__user-years">
              {{ user_data.full_years + " years" }}
            </p>
          </div>
        </div>
        <div class="main__input-checkboxWrapper">
          <label class="checkbox">
            <input type="checkbox" v-model="dropped" />
            <span class="checkbox__checkmark">
              <div class="checkbox__checkmark-fill"></div>
            </span>
            dropped
          </label>
          <label class="checkbox">
            <input type="checkbox" v-model="watching" />
            <span class="checkbox__checkmark">
              <div class="checkbox__checkmark-fill"></div>
            </span>
            watching
          </label>
          <label class="checkbox">
            <input type="checkbox" v-model="planned" />
            <span class="checkbox__checkmark">
              <div class="checkbox__checkmark-fill"></div>
            </span>
            planned
          </label>
          <label class="checkbox">
            <input type="checkbox" v-model="completed" />
            <span class="checkbox__checkmark">
              <div class="checkbox__checkmark-fill"></div>
            </span>
            completed
          </label>
        </div>
        <div class="main__input-wrapper">
          <input class="main__input-input" v-model="nickname" />
          <button class="main__input-button" @click="getAllData">search</button>
        </div>
        <!-- <Bar
        :chart-options="chartOptions"
        :chart-data="chartData"
        :chart-id="'bar-chart'"
        :dataset-id-key="'label'"
        :css-classes="'chart'"
      /> -->
      </div>
      <div class="main__filter" :class="{ disable: downloadAllActive }">
        <p class="main__filter-title">Anime filter {{}}</p>
        <div class="main__input-wrapper">
          <input class="main__input-input" v-model="filterstr" />
          <button class="main__input-button" @click="filter_data">
            filter
          </button>
        </div>
      </div>
      <div class="main__settings" :class="{ disable: downloadAllActive }">
        <label class="main__settings-path"> Download path </label>
        <input type="text" class="main__settings-input" v-model="downloadDir" />
      </div>
      <div class="main__download">
        <label class="checkbox" :class="{ disable: downloadAllActive }">
          <input type="checkbox" v-model="willDownloadOpenings" />
          <span class="checkbox__checkmark">
            <div class="checkbox__checkmark-fill"></div>
          </span>
          Openings
        </label>
        <label class="checkbox" :class="{ disable: downloadAllActive }">
          <input type="checkbox" v-model="willDownloadEndings" />
          <span class="checkbox__checkmark">
            <div class="checkbox__checkmark-fill"></div>
          </span>
          Endings
        </label>
        <Transition name="fade" mode="out-in">
          <button
            class="main__download-btn"
            v-if="!downloadAllActive"
            @click="downloadAllAnime"
          >
            Download
          </button>
          <button
            class="main__download-btn"
            :class="{ disable: stopDownloading }"
            v-else
            @click="stopDownloadAllAnime"
          >
            Stop
          </button>
        </Transition>
      </div>
    </div>

    <div class="main__animes">
      <Suspense v-for="(i, index) in user_anime_data">
        <AnimeComponent
          :key="index"
          ref="animeComponentRefs"
          :index="index"
          :animeId="i.anime.id"
          :animeImg="'https://shikimori.one/' + i.anime.image.preview"
          :animeTitle="i.anime.name"
          @downloadAllComplete="downloadCompleteHandler"
        ></AnimeComponent>
        <!-- <template #fallback> Loading... </template> -->
      </Suspense>
    </div>
  </div>
</template>

<script setup>
import AnimeComponent from "./AnimeComponent.vue";
import { $vfm, VueFinalModal, ModalsContainer } from "vue-final-modal";
import { ipcRenderer } from "../electron";
import { ref, provide, computed, watch } from "vue";

// auto updater
const showModalUpdateAvailable = ref(false);
const showModalUpdateDownloaded = ref(false);

function sendInstallUpdate() {
  showModalUpdateDownloaded.value = false;
  ipcRenderer.send("installUpdate");
}

//recieve auto updater massages from main process
window.api.receive("my-update-available", () => {
  console.log("update-available");
  showModalUpdateAvailable.value = true;
});
window.api.receive("my-update-downloaded", () => {
  console.log("update-downloaded");
  showModalUpdateDownloaded.value = true;
});

const animeComponentRefs = ref([]);
// -1 not downloading
const animeDownloadIndex = ref(-1);
provide("animeDownloadIndex", animeDownloadIndex);
const stopDownloading = ref(false);

const user_data = ref(null);
const user_anime_data = ref([]);
const user_filtered_anime_data = ref([]);

const nickname = ref("");
if (localStorage.nickname) {
  nickname.value = localStorage.nickname;
}
const downloadAllActive = computed(() => {
  return animeDownloadIndex.value !== -1;
});
provide("downloadAllActive", downloadAllActive);

const dropped = ref(false);
if (localStorage.dropped) {
  dropped.value = localStorage.dropped === "true";
}
const watching = ref(false);
if (localStorage.watching) {
  watching.value = localStorage.watching === "true";
}
const planned = ref(false);
if (localStorage.planned) {
  planned.value = localStorage.planned === "true";
}
const completed = ref(false);
if (localStorage.completed) {
  completed.value = localStorage.completed === "true";
}

const filterstr = ref("");
const willDownloadOpenings = ref(true);
if (localStorage.willDownloadOpenings) {
  willDownloadOpenings.value = localStorage.willDownloadOpenings === "true";
}
provide("willDownloadOpenings", willDownloadOpenings);
const willDownloadEndings = ref(false);
if (localStorage.willDownloadEndings) {
  willDownloadEndings.value = localStorage.willDownloadEndings === "true";
}
provide("willDownloadEndings", willDownloadEndings);

const downloadDir = ref("");
if (localStorage.downloadDir) {
  downloadDir.value = localStorage.downloadDir;
}
provide("downloadDir", downloadDir);
const isDownloadingAll = ref(false);

function downloadAllAnime() {
  isDownloadingAll.value = true;
  animeDownloadIndex.value = 0;
}
function stopDownloadAllAnime() {
  console.log("Stop downloading.Waiting for the last download complete...");
  stopDownloading.value = true;
}

function downloadCompleteHandler(index) {
  if (!isDownloadingAll.value) {
    console.log("Download all complete");
    isDownloadingAll.value = false;
    return;
  }
  if (animeDownloadIndex.value + 1 == animeComponentRefs.value.length) {
    animeDownloadIndex.value = -1;
    console.log("Download all complete");
    return;
  }
  if (stopDownloading.value) {
    animeDownloadIndex.value = -1;
    stopDownloading.value = false;
    isDownloadingAll.value = false;
    return;
  }
  animeDownloadIndex.value++;
}

//Получаем файлы в дериктории
let dirFiles = [];
if (downloadDir.value != "") {
  dirFiles = await window.fs.readdir(downloadDir.value);
}

provide("dirFiles", dirFiles);
// //////////////
function filter_data() {
  // if (filterstr.value.length > 0) {
  //   user_filtered_anime_data.value = user_anime_data.value.filter((el) => {
  //     return (
  //       el.anime.name.toLowerCase().includes(filterstr.value.toLowerCase()) ||
  //       el.anime.russian.toLowerCase().includes(filterstr.value.toLowerCase())
  //     );
  //   });
  //   console.log(user_filtered_anime_data.value);
  // } else user_filtered_anime_data.value = user_anime_data.value;
}
async function getJSON(url) {
  const response = await fetch(url);
  return await response.json();
}
async function getAllData() {
  localStorage.nickname = nickname.value;
  user_data.value = null;
  user_anime_data.value = [];
  user_filtered_anime_data.value = [];
  user_data.value = await getJSON(
    `https://shikimori.one/api/users/${nickname.value}?is_nickname=1`
  );
  let user_id = user_data.value.id;

  if (completed.value) {
    let completedArr = await getJSON(
      `https://shikimori.one/api/users/${user_id}/anime_rates?limit=5000&status=completed`
    );
    user_anime_data.value.push(...completedArr);
  }
  if (watching.value) {
    let watchingArr = await getJSON(
      `https://shikimori.one/api/users/${user_id}/anime_rates?limit=5000&status=watching`
    );
    user_anime_data.value.push(...watchingArr);
  }
  if (dropped.value) {
    let droppedArr = await getJSON(
      `https://shikimori.one/api/users/${user_id}/anime_rates?limit=5000&status=dropped`
    );
    user_anime_data.value.push(...droppedArr);
  }
  if (planned.value) {
    let plannedArr = await getJSON(
      `https://shikimori.one/api/users/${user_id}/anime_rates?limit=5000&status=planned`
    );
    user_anime_data.value.push(...plannedArr);
  }
  // if (user_anime_data.value.length > 0) {
  //   filter_data();
  // }
}
// localStorage

let downloadDirTimer;
watch(downloadDir, (value) => {
  if (downloadDirTimer !== undefined) {
    clearTimeout(downloadDirTimer);
  }
  downloadDirTimer = setTimeout(() => {
    localStorage.downloadDir = value;
  }, 1000);
});
let droppedTimer;
watch(dropped, (value) => {
  if (droppedTimer !== undefined) {
    clearTimeout(droppedTimer);
  }
  droppedTimer = setTimeout(() => {
    localStorage.dropped = value;
  }, 1000);
});
let watchingTimer;
watch(watching, (value) => {
  if (watchingTimer !== undefined) {
    clearTimeout(watchingTimer);
  }
  watchingTimer = setTimeout(() => {
    localStorage.watching = value;
  }, 1000);
});
let plannedTimer;
watch(planned, (value) => {
  if (plannedTimer !== undefined) {
    clearTimeout(plannedTimer);
  }
  plannedTimer = setTimeout(() => {
    localStorage.planned = value;
  }, 1000);
});
let completedTimer;
watch(completed, (value) => {
  if (completedTimer !== undefined) {
    clearTimeout(completedTimer);
  }
  completedTimer = setTimeout(() => {
    localStorage.completed = value;
  }, 1000);
});
let willDownloadOpeningsTimer;
watch(willDownloadOpenings, (value) => {
  if (willDownloadOpeningsTimer !== undefined) {
    clearTimeout(willDownloadOpeningsTimer);
  }
  willDownloadOpeningsTimer = setTimeout(() => {
    localStorage.willDownloadOpenings = value;
  }, 1000);
});
let willDownloadEndingsTimer;
watch(willDownloadEndings, (value) => {
  if (willDownloadEndingsTimer !== undefined) {
    clearTimeout(willDownloadEndingsTimer);
  }
  willDownloadEndingsTimer = setTimeout(() => {
    localStorage.willDownloadEndings = value;
  }, 1000);
});

await getAllData();
</script>

<style scoped>
.main {
  display: flex;
  height: 100vh;
  /* padding: 8px; */
  background-color: #efefef;
}
.main__left {
  width: 250px;
}
.main__settings,
.main__user,
.main__download,
.main__filter {
  margin: 8px;
  background-color: var(--thirdColor);
  color: var(--textColor);
  padding: 8px;
  box-shadow: rgb(50 50 93 / 25%) 1px 3px 6px 0px,
    rgb(0 0 0 / 30%) 0px 3px 7px -3px;
  border: 2px solid var(--accentColor);
}

.main__user-data {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.main__user-img {
  border: 2px solid var(--accentColor);
  border-radius: 2px;
  padding: 1px;
  box-shadow: rgb(50 50 93 / 25%) 1px 3px 6px 0px,
    rgb(0 0 0 / 30%) 0px 3px 7px -3px;
}
.main__user-info {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  font-size: 16px;
  line-height: 16px;
  font-weight: 700;
}
.main__input-wrapper {
  display: flex;
  gap: 16px;
}
.main__input-input,
.main__settings-input {
  width: 55%;
  background-color: var(--fonColor);
  outline: none;
  border: 2px solid var(--accentColor);
  border-radius: 5px;
  color: var(--textColor);
  padding-inline: 8px;
}
.main__settings-input {
  width: 100%;
}
.main__settings-path {
  font-size: 16px;
  line-height: 16px;
  font-weight: 700;
  margin-left: 3px;
}
.main__input-button,
.main__download-btn {
  padding: 3px 10px;
  border: 1px solid var(--accentColor);
  border-radius: 5px;
  cursor: pointer;
  box-shadow: rgba(0, 0, 0, 0.02) 0px 1px 3px 0px,
    rgba(27, 31, 35, 0.15) 0px 0px 0px 1px;
  background-color: var(--secondColor);
  color: var(--textColor);
  font-weight: 700;
  transition: background 0.3s ease-in-out, border 0.3s ease-in-out;
}
.main__download-btn.disabled {
  pointer-events: none;
  background-color: var(--thirdColor);
  border-color: var(--textColor);
  opacity: 0.3;
}
.main__input-button:hover,
.main__download-btn:hover {
  background-color: var(--accentColor);
}

.main__animes {
  padding: 8px;
  overflow-y: scroll;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;

  /* snap */
  /* scroll-padding-block: 4px;
  scroll-snap-type: block mandatory; */
}
/* .main__animes > * {
  scroll-snap-align: start;
} */
.main__input-checkboxWrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 4px;
  margin-bottom: 8px;
}
.checkbox {
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  user-select: none;
}
.checkbox input {
  display: none;
}

.checkbox__checkmark {
  padding: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 15px;
  width: 15px;
  margin-bottom: 2px;
  background-color: var(--fonColor);
  border: 2px solid var(--accentColor);
  border-radius: 3px;
}

.checkbox__checkmark-fill {
  width: 100%;
  height: 100%;
  border-radius: 3px;
  background-color: var(--textColor);
  transform: scale(0.01);
  transition: transform 0.3s ease-in-out;
}
.checkbox input:checked + .checkbox__checkmark > .checkbox__checkmark-fill {
  transform: scale(1);
}

.main__filter-title {
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 4px;
  margin-left: 4px;
}
.main__download {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.main__download-btn {
  margin-top: 8px;
  grid-column: 1/-1;
}

.modal {
  position: absolute;
  left: 50%;
  top: 50%;
  background-color: var(--thirdColor);
  color: var(--textColor);
  width: max-content;
  transform: translateX(-50%) translateY(-50%);
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 8px;
  font-weight: 700;
  box-shadow: rgb(50 50 93 / 25%) 1px 3px 6px 0px,
    rgb(0 0 0 / 30%) 0px 3px 7px -3px;
  border: 2px solid var(--accentColor);
  border-radius: 2px;
}
.modal > button {
  margin-top: 8px;
  padding: 2px 16px;
  width: fit-content;
  border: 1px solid var(--accentColor);
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease-in-out, border 0.3s ease-in-out;
  box-shadow: rgba(0, 0, 0, 0.02) 0px 1px 3px 0px,
    rgba(27, 31, 35, 0.15) 0px 0px 0px 1px;
  background-color: var(--secondColor);
}
.modal > button:hover {
  background-color: var(--accentColor);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
