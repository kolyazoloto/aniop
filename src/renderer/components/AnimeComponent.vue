<template>
  <Transition name="fade" appear>
    <div
      class="animeComponentWrapper"
      ref="animeComponentWrapper"
      :class="{
        'animeComponentWrapper--downloading':
          !downloadFinished && downloadStart,
      }"
    >
      <img :src="animeImg" alt="" class="animeImg" />
      <div class="accordionsWrapper">
        <div class="accordionsWrapper__top">
          <p class="animeTitle">{{ animeTitle }}</p>
          <div class="dowloadWrapper">
            <Transition name="fade">
              <p
                class="dowload_counter"
                v-if="willDownloadOpenings || willDownloadEndings"
              >
                {{ `${successDownloadCounter}/${totalAnimeLength}` }}
              </p>
            </Transition>
            <template v-if="willDownloadOpenings || willDownloadEndings">
              <Transition name="fade">
                <div class="download-error" v-if="downloadError">
                  <svg viewBox="0 0 24 24">
                    <path d="M10 3H14V14H10V3M10 21V17H14V21H10Z" />
                  </svg></div
              ></Transition>
              <Transition name="fade" mode="out-in">
                <div class="download-finished" v-if="downloadFinished" key="1">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"
                    />
                  </svg>
                </div>
                <button
                  class="download_all"
                  :class="{ disable: downloadAllActive }"
                  @click="downloadAll"
                  v-else-if="!downloadFinished && !downloadStart"
                  key="0"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                  </svg>
                </button>
                <circle-progress
                  v-else-if="!downloadFinished && downloadStart"
                  key="2"
                  :percent="percent"
                  :size="31"
                  :border-width="4"
                  :border-bg-width="6"
                  :fill-color="'#0e2206'"
                  :empty-color="'#bcbf9b'"
                  class="circle-progress-bar"
                />
              </Transition>
            </template>
          </div>
        </div>
        <div class="accordBox">
          <button
            class="accordion"
            :class="{ active: accordionOpIsActive }"
            @click="toggleOpAccordion"
          >
            Openings
          </button>
          <div
            class="panel"
            ref="panelOpeningsRef"
            :style="{
              maxHeight: !accordionOpIsActive
                ? null
                : panelOpeningsRef == null
                ? 0 + 'px'
                : panelOpeningsRef.scrollHeight + 'px',
            }"
          >
            <Suspense>
              <!-- component with nested async dependencies -->
              <MusicComponent
                v-for="(i, index) in openings"
                @downloadComplete="musicComponentDownloadCompleteHandler"
                ref="openingMusicRefs"
                :key="index"
                :musicData="i"
                :type="'opening'"
              ></MusicComponent>

              <!-- loading state via #fallback slot -->
              <template #fallback> Loading... </template>
            </Suspense>
          </div>
        </div>

        <div class="accordBox">
          <button
            class="accordion"
            :class="{ active: accordionEndIsActive }"
            @click="toggleEndAccordion"
          >
            Endings
          </button>
          <div
            class="panel"
            ref="panelEndingsRef"
            :style="{
              maxHeight: !accordionEndIsActive
                ? null
                : panelEndingsRef == null
                ? 0 + 'px'
                : panelEndingsRef.scrollHeight + 'px',
            }"
          >
            <Suspense>
              <!-- component with nested async dependencies -->
              <MusicComponent
                v-for="(i, index) in endings"
                @downloadComplete="musicComponentDownloadCompleteHandler"
                ref="endingMusicRefs"
                :key="index"
                :musicData="i"
                :type="'ending'"
              ></MusicComponent>

              <!-- loading state via #fallback slot -->
              <template #fallback> Loading... </template>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
// import download from "downloadjs";
import MusicComponent from "./MusicComponent.vue";
// import "vue3-circle-progress/dist/circle-progress.css";
import CircleProgress from "vue3-circle-progress";
import { onMounted, ref, computed, watch, inject } from "vue";

// refs
const animeComponentWrapper = ref(null);
//

const props = defineProps(["animeId", "animeImg", "animeTitle", "index"]);
const emit = defineEmits(["downloadAllComplete", "downloadAllStarted"]);

const anime_id = props.animeId;

// ?????????? myanimelist ?? ???????????? ???????????????? ??????????.

const songsNamesMemory = inject("songsNamesMemory");
let endandop;
if (songsNamesMemory.value[anime_id] !== undefined) {
  console.log("?????????? ???????? ?? ????????????");
  endandop = songsNamesMemory.value[anime_id];
} else {
  console.log("?????????? ?????? ?? ???????????? ?????????? ????????????????????????");
  endandop = await loadMal();
  songsNamesMemory.value[anime_id] = endandop;
}

// console.log(songsNamesMemory.value);

const openings = endandop[0];
const endings = endandop[1];
const willDownloadOpenings = inject("willDownloadOpenings");
const willDownloadEndings = inject("willDownloadEndings");

// refs
const panelOpeningsRef = ref(null);
const panelEndingsRef = ref(null);
const openingMusicRefs = ref([]);
const endingMusicRefs = ref([]);
const totalAnimeLength = computed(() => {
  if (willDownloadOpenings.value && !willDownloadEndings.value)
    return openingMusicRefs.value.length;
  else if (!willDownloadOpenings.value && willDownloadEndings.value)
    return endingMusicRefs.value.length;
  else if (willDownloadOpenings.value && willDownloadEndings.value)
    return openingMusicRefs.value.length + endingMusicRefs.value.length;
});

// download all
const downloadAllActive = inject("downloadAllActive");

// download counter
const downloadOpeningsCounter = ref(0);
const downloadEndingsCounter = ref(0);
const downloadCounter = computed(() => {
  if (willDownloadOpenings.value && !willDownloadEndings.value)
    return downloadOpeningsCounter.value;
  else if (!willDownloadOpenings.value && willDownloadEndings.value)
    return downloadEndingsCounter.value;
  else if (willDownloadOpenings.value && willDownloadEndings.value)
    return downloadOpeningsCounter.value + downloadEndingsCounter.value;
});

const successDownloadOpeningsCounter = ref(0);
const successDownloadEndingsCounter = ref(0);
const successDownloadCounter = computed(() => {
  if (willDownloadOpenings.value && !willDownloadEndings.value)
    return successDownloadOpeningsCounter.value;
  else if (!willDownloadOpenings.value && willDownloadEndings.value)
    return successDownloadEndingsCounter.value;
  else if (willDownloadOpenings.value && willDownloadEndings.value)
    return (
      successDownloadOpeningsCounter.value + successDownloadEndingsCounter.value
    );
});
const downloadFinished = computed(() => {
  return downloadCounter.value == totalAnimeLength.value;
});
// watch download finish
watch(downloadFinished, (newVal) => {
  if (newVal) {
    console.log("???????????????? ??????????????????  " + props.animeTitle);
    emit("downloadAllComplete", props.index);
    downloadStart.value = false;
  }
});
// watch download start when change index
const animeDownloadIndex = inject("animeDownloadIndex");
watch(animeDownloadIndex, (value) => {
  // console.log(value);
  if (value === props.index) {
    downloadAll();
    animeComponentWrapper.value.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }
});

const downloadStart = ref(false);
const downloadError = ref(false);
const percent = computed(() => {
  return (downloadCounter.value / totalAnimeLength.value) * 100;
});

function musicComponentDownloadCompleteHandler(value) {
  if (value.type === "opening") {
    downloadOpeningsCounter.value++;
  } else downloadEndingsCounter.value++;

  if (value.ok) {
    if (value.type === "opening") {
      successDownloadOpeningsCounter.value++;
    } else {
      successDownloadEndingsCounter.value++;
    }
  } else downloadError.value = true;
}

function downloadAll() {
  if (downloadFinished.value) {
    console.log("???????????????? ?????? ??????????????????  " + props.animeTitle);
    emit("downloadAllComplete", props.index);
    return;
  }

  downloadStart.value = true;
  // downloadCounter.value = 0;
  // successDownloadCounter.value = 0;
  if (willDownloadOpenings.value && !willDownloadEndings.value) {
    openingMusicRefs.value.forEach(async (el) => {
      el.downloadClickHandler();
    });
  } else if (!willDownloadOpenings.value && willDownloadEndings.value) {
    endingMusicRefs.value.forEach(async (el) => {
      el.downloadClickHandler();
    });
  } else if (willDownloadOpenings.value && willDownloadEndings.value) {
    openingMusicRefs.value.forEach(async (el) => {
      el.downloadClickHandler();
    });
    endingMusicRefs.value.forEach(async (el) => {
      el.downloadClickHandler();
    });
  }
}

async function getPage(url) {
  let response = await fetch(url, {
    method: "GET",
  });
  let text = await response.text();
  return new DOMParser().parseFromString(text, "text/html");
}

async function loadMal() {
  console.log("??????????????");
  let url = "https://myanimelist.net/anime/" + anime_id;
  let dom = await getPage(url);
  // console.log(dom);
  return [getMusic(dom, "opnening"), getMusic(dom, "ending")];
}

function getMusic(doc, class_name) {
  let music = doc.getElementsByClassName(
    "theme-songs js-theme-songs " + class_name
  )[0];
  let childs = [];
  let authors = music.getElementsByClassName("theme-song-artist");
  let counter = 1;
  for (var i = 0; i < authors.length; i++) {
    let td = authors[i].parentNode;
    let episodes = td.getElementsByClassName("theme-song-episode")[0];
    if (episodes) episodes = episodes.textContent;
    else episodes = "";
    let songName = td.getElementsByClassName("theme-song-title")[0];
    let cleanSongName;
    let cleanAuthors;
    let originalName;

    if (songName) {
      originalName = songName.textContent.match(/\(.+\)/);
      if (originalName != null) {
        originalName = originalName[0].replaceAll(/[()]/g, "");
      }
      cleanSongName = songName.textContent
        .replaceAll(/["*???/\\~:?<>|]/g, "")
        .replaceAll(/-/g, " ")
        .replaceAll(/\(.+\)/g, "")
        .trim();
      cleanAuthors = authors[i].textContent
        .replaceAll(/["*???/\\~:?<>|]/g, "")
        .replace("by", "")
        .trim();

      let child = {
        counter: counter,
        songName: cleanSongName,
        authors: cleanAuthors,
        episodes: episodes,
        url: {},
      };
      childs.push(child);
    } else {
      for (let songName2 of td.childNodes) {
        if (songName2.nodeType === 3) {
          originalName = songName2.textContent.match(/\(.+\)/);
          if (originalName != null) {
            originalName = originalName[0].replaceAll(/[()]/g, "");
          }
          cleanSongName = songName2.textContent
            .replaceAll(/["*???/\\~:?<>|]/g, "")
            .replaceAll(/-/g, " ")
            .replaceAll(/\(.+\)/g, "")
            .trim();
          cleanAuthors = authors[i].textContent
            .replaceAll(/["*???/\\~:?<>|]/g, "")
            .replace("by", "")
            .trim();

          let child = {
            counter: counter,
            songName: cleanSongName,
            authors: cleanAuthors,
            episodes: episodes,
            url: {},
          };
          childs.push(child);
          break;
        }
      }
    }
    counter++;
  }
  // console.log(childs);
  return childs;
}

// accordion
let accordionOpIsActive = ref(false);
function toggleOpAccordion() {
  accordionOpIsActive.value = !accordionOpIsActive.value;
}
let accordionEndIsActive = ref(false);
function toggleEndAccordion() {
  accordionEndIsActive.value = !accordionEndIsActive.value;
}

defineExpose({
  downloadAll,
  totalAnimeLength,
  downloadCounter,
  successDownloadCounter,
  downloadStart,
});
</script>

<style scoped>
.animeComponentWrapper {
  display: flex;
  gap: 20px;
  border: 2px solid var(--secondColor);
  border-radius: 10px;
  padding: 8px;
  background: transparent;
  transition: background 0.7s ease-in-out, border 0.7s ease-in-out;
}
.animeComponentWrapper--downloading {
  background: linear-gradient(
    100deg,
    var(--secondColor),
    transparent,
    var(--secondColor),
    transparent
  );
  background-size: 300%;
  animation: gradient_animation 3s infinite;
  border-color: var(--textColor);
}
@keyframes gradient_animation {
  from {
    background-position-x: left;
  }
  to {
    background-position-x: right;
  }
}

.animeImg {
  width: 93px;
  height: max-content;
  box-shadow: rgb(50 50 93 / 25%) 1px 3px 6px 0px,
    rgb(0 0 0 / 30%) 0px 3px 7px -3px;
  border-radius: 8px;
  border: 1px solid var(--textColor);
}

.accordionsWrapper {
  flex: 1;
}
.accordionsWrapper__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 50px;
}
.animeTitle {
  /* font-size: 22px; */
  font-size: clamp(12px, 2vw, 20px);
  font-weight: 700;
  /* text-decoration: underline; */
}
.dowloadWrapper {
  display: flex;
  gap: 5px;
  align-items: center;
}
.dowload_counter {
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  margin-right: 5px;
}
.download_all {
  flex-shrink: 0;
  background-color: var(--secondColor);
  color: var(--textColor);
  cursor: pointer;
  padding: 5px;
  font-weight: 500;
  font-size: 13px;
  border: none;
  border-radius: 5px;
  outline: none;
  box-shadow: rgb(50 50 93 / 25%) 1px 3px 6px 0px,
    rgb(0 0 0 / 30%) 0px 3px 7px -3px;

  transition: 0.3s;
}
.download_all:hover {
  background-color: var(--accentColor);
}

.download-error {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background-color: var(--secondColor);
  box-shadow: rgba(0, 0, 0, 0.02) 0px 1px 3px 0px,
    rgba(27, 31, 35, 0.15) 0px 0px 0px 1px;
}
.download-error svg {
  width: 70%;
  height: 70%;
  fill: rgb(218, 51, 51);
}
.download-finished {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background-color: var(--secondColor);
  box-shadow: rgba(0, 0, 0, 0.02) 0px 1px 3px 0px,
    rgba(27, 31, 35, 0.15) 0px 0px 0px 1px;
}
.download-finished svg {
  width: 70%;
  height: 70%;
  fill: var(--textColor);
}
.accordBox {
  margin-top: 10px;
}

.accordion {
  background-color: var(--secondColor);
  color: var(--textColor);
  cursor: pointer;
  padding: 8px;
  font-weight: 700;
  font-size: 15px;
  width: 100%;
  text-align: left;
  border: none;
  border-radius: 5px;
  outline: none;
  box-shadow: rgb(50 50 93 / 25%) 1px 3px 6px 0px,
    rgb(0 0 0 / 30%) 0px 3px 7px -3px;
  transform: translate3d(1);
  transition: 0.3s;
}

.active {
  background-color: var(--accentColor);
  border-radius: 0px;
  box-shadow: rgb(50 50 93 / 25%) 0px 0px 7px -2px,
    rgb(0 0 0 / 30%) 0px 3px 7px -3px;
}
.accordion:hover {
  background-color: var(--accentColor);
}

/* Style the accordion panel. Note: hidden by default */
.panel {
  padding: 0px 5px;
  background-color: var(--thirdColor);
  max-height: 0;
  overflow: hidden;
  box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px,
    rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;
  transform: translate3d(1);
  transition: max-height 0.2s ease-out;
}
.download_all {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  cursor: pointer;
  border: none;
  border-radius: 50%;
  background-color: var(--secondColor);
  box-shadow: rgba(0, 0, 0, 0.02) 0px 1px 3px 0px,
    rgba(27, 31, 35, 0.15) 0px 0px 0px 1px;
  transition: background 0.2s ease-in-out;
  overflow: hidden;
}
.download_all:hover {
  background-color: var(--accentColor);
}
.download_all svg {
  width: 90%;
  height: 90%;
  fill: var(--textColor);
  /* animation-duration: 3s;
  animation-name: slidedown;
  animation-iteration-count: infinite; */
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
