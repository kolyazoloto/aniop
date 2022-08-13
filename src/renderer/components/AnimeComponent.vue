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
      :style="{ display: accordionOpIsActive ? 'block' : 'none' }"
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
      :style="{ display: accordionEndIsActive ? 'block' : 'none' }"
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
import { onMounted, ref } from "vue";

let anime_id = 269;
const endandop = await loadMal();
const openings = endandop[0];
const endings = endandop[1];

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
  border: 1px solid black;
}
.accordBox + .accordBox {
  margin-top: 10px;
}
.accordion {
  background-color: #eee;
  color: #444;
  cursor: pointer;
  padding: 18px;
  width: 100%;
  text-align: left;
  border: none;
  outline: none;
  transition: 0.4s;
}

/* Add a background color to the button if it is clicked on (add the .active class with JS), and when you move the mouse over it (hover) */
.active,
.accordion:hover {
  background-color: #ccc;
}

/* Style the accordion panel. Note: hidden by default */
.panel {
  padding: 10px 18px;
  background-color: rgb(219, 217, 217);
  display: none;
  overflow: hidden;
}
.accordion:after {
  content: "\02795"; /* Unicode character for "plus" sign (+) */
  font-size: 13px;
  color: #777;
  float: right;
  margin-left: 5px;
}

.active:after {
  content: "\2796"; /* Unicode character for "minus" sign (-) */
}
</style>
