<template>
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
          :key="index"
          :musicData="i"
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
          :key="index"
          :musicData="i"
        ></MusicComponent>

        <!-- loading state via #fallback slot -->
        <template #fallback> Loading... </template>
      </Suspense>
    </div>
  </div>
</template>

<script setup>
// import download from "downloadjs";
import MusicComponent from "./MusicComponent.vue";
import { onMounted, ref, computed } from "vue";

let anime_id = 32182;
const endandop = await loadMal();
const openings = endandop[0];
const endings = endandop[1];
// refs
const panelOpeningsRef = ref(null);
const panelEndingsRef = ref(null);

async function getPage(url) {
  let response = await fetch(url, {
    method: "GET",
  });
  let text = await response.text();
  return new DOMParser().parseFromString(text, "text/html");
}

async function loadMal() {
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
        .replaceAll(/["*♪]/g, "")
        .replaceAll(/-/g, " ")
        .replaceAll(/\(.+\)/g, "")
        .trim();
      cleanAuthors = authors[i].textContent.replace("by", "").trim();

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
            .replaceAll(/["*♪]/g, "")
            .replaceAll(/-/g, " ")
            .replaceAll(/\(.+\)/g, "")
            .trim();
          cleanAuthors = authors[i].textContent.replace("by", "").trim();

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
</script>

<style scoped>
/* Style the buttons that are used to open and close the accordion panel */
.accordBox {
  /* border: 1px solid black; */
}
.accordBox + .accordBox {
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

  transition: 0.4s;
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

  transition: max-height 0.2s ease-out;
}
</style>
