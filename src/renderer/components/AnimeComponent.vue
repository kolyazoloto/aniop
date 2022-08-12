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
      <div class="song" v-for="(i, index) in openings" :key="index">
        <p>
          {{ i.songName + " - " + i.authors }}
        </p>
        <button
          class="download-btn"
          v-if="i.url != null"
          @click="sendDownloadRequest(i.url, i.songName, i.authors)"
        >
          download
        </button>
      </div>
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
      <div class="song" v-for="(i, index) in endings" :key="index">
        <p>
          {{ i.songName + " - " + i.authors }}
        </p>
        <button
          class="download-btn"
          v-if="i.url != null"
          @click="sendDownloadRequest(i.url, i.songName, i.authors)"
        >
          download
        </button>
      </div>
    </div>
  </div>

  <h1 class="persent">{{ persent }}</h1>
</template>

<script setup>
// import download from "downloadjs";
import { ipcRenderer } from "../electron";
import { onMounted, ref } from "vue";

let anime_id = 9253;
let openings = ref([]);
let endings = ref([]);
let persent = ref(0);

async function getPage(url) {
  return new Promise((resolve, reject) => {
    fetch(url, {
      method: "GET",
    })
      .then((response) => {
        return response.text();
      })
      .then((data) => {
        resolve(new DOMParser().parseFromString(data, "text/html"));
      });
  });
}

function loadMal() {
  let url = "https://myanimelist.net/anime/" + anime_id;
  getPage(url).then((dom) => {
    // console.log(dom);
    openings.value = getMusic(dom, "opnening");
    endings.value = getMusic(dom, "ending");
  });
}

function getMusic(doc, class_name) {
  let music = doc.getElementsByClassName(
    "theme-songs js-theme-songs " + class_name
  )[0];
  // console.log(class_name);
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
        .replaceAll(/["*]/g, "")
        .replaceAll(/-/g, " ")
        .replaceAll(/\(.+\)/g, "")
        .trim();
      cleanAuthors = authors[i].textContent.replace("by", "").trim();
      // childs.push({
      //   counter: counter,
      //   songName: cleanSongName,
      //   authors: cleanAuthors,
      //   episodes: episodes,
      //   url: null,
      // });
      parseMUZOFOND(cleanSongName, cleanAuthors, originalName).then(
        (data) => {
          childs.push({
            counter: counter,
            songName: cleanSongName,
            authors: cleanAuthors,
            episodes: episodes,
            url: data,
          });
        },
        (onRejectData) => {
          childs.push({
            counter: counter,
            songName: cleanSongName,
            authors: cleanAuthors,
            episodes: episodes,
            url: null,
          });
        }
      );
    } else {
      for (let songName2 of td.childNodes) {
        if (songName2.nodeType === 3) {
          originalName = songName2.textContent.match(/\(.+\)/);
          if (originalName != null) {
            originalName = originalName[0].replaceAll(/[()]/g, "");
            // console.log(originalName);
          }
          cleanSongName = songName2.textContent
            .replaceAll(/["*]/g, "")
            .replaceAll(/-/g, " ")
            .replaceAll(/\(.+\)/g, "")
            .trim();
          cleanAuthors = authors[i].textContent.replace("by", "").trim();
          // console.log(songName2.textContent + authors[i].textContent);
          // childs.push({
          //   counter: counter,
          //   songName: cleanSongName,
          //   authors: cleanAuthors,
          //   episodes: episodes,
          //   url: null,
          // });
          parseMUZOFOND(cleanSongName, cleanAuthors, originalName).then(
            (data) => {
              childs.push({
                counter: counter,
                songName: cleanSongName,
                authors: cleanAuthors,
                episodes: episodes,
                url: data,
              });
            },
            (onRejectData) => {
              childs.push({
                counter: counter,
                songName: cleanSongName,
                authors: cleanAuthors,
                episodes: episodes,
                url: null,
              });
            }
          );

          break;
        }
      }
    }
    counter++;
  }
  // childs.forEach((el) => {
  //   console.log(el.songName);
  // });

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

function sendDownloadRequest(url, songName, author) {
  ipcRenderer
    .invoke("download", {
      url: url,
      properties: {
        directory: "C:/Users/Nikolay/Desktop/testest",
        filename: `${author} - ${songName}.mp3`,
        songName: songName,
        author: author,
      },
    })
    .then((data) => {
      console.log(data);
    });
}

// parse and download music

function parseOSANIME(song, auth) {
  console.log("START PARSING");
  return new Promise((resolve, reject) => {
    let url = "https://osanime.com/site-search.html?to-search=";
    let siteurl = "https://osanime.com";
    let songName = song.toLowerCase();
    let author = auth.toLowerCase();

    let fullURL =
      url + `${author.replaceAll(" ", "+")}+${songName.replaceAll(" ", "+")}`;
    let backwardsUrl =
      url + `${songName.replaceAll(" ", "+")}+${author.replaceAll(" ", "+")}`;
    let onlySongNameUrl = url + `${songName.replaceAll(" ", "+")}`;

    getPage(fullURL).then((dom) => {
      let fetchresults = Array.from(dom.querySelectorAll("article>a"));
      let result = fetchresults.find((el) => {
        return el
          .querySelector(".vret > a")
          .title.toLowerCase()
          .includes(songName);
      });
      if (result != undefined) {
        let fetchurl =
          siteurl + result.querySelector(".vret > a").getAttribute("href");
        getPage(fetchurl).then((dom) => {
          let mp3url = dom.querySelector(".kopler > a.btn").href;
          // console.log(mp3url);

          fetch(mp3url).then((response) => {
            if (response.status == 404) reject({ type: 1, text: "Broken url" });
            // console.log(response.url);
            console.log(response.url);
            resolve(response.url);

            // ipcRenderer.send("download", {
            //   url: response.url,
            //   properties: {
            //     directory: "C:/Users/Nikolay/Desktop/testest",
            //     filename: `${author} - ${songName}.mp3`,
            //   },
            // });
          });
        });
      } else {
        console.error("Тaкой песни нет   --  " + onlySongNameUrl);
        reject({ type: 0, text: "no song found" });
      }
    });
  });
}

function parseMUZOFOND(song, auth, originalName) {
  // console.log(`START PARSING MUZOFOND  ${song} -- ${auth}`);
  return new Promise((resolve, reject) => {
    let url = "https://muzofond.fm/search/";
    let songName = song.toLowerCase();
    let author = auth.toLowerCase();

    let fullURL =
      url +
      `${songName.replaceAll(" ", "%20")}%20${author.replaceAll(" ", "%20")}`;

    // if (originalName != null) {
    //   fullURL = url + originalName;
    //   songName = originalName;
    // }
    // let backwardsUrl =
    //   url +
    //   `${songName.replaceAll(" ", "%20")}%20${author.replaceAll(" ", "%20")}`;
    // let onlySongNameUrl = url + `${songName.replaceAll(" ", "%20")}`;

    console.log(fullURL);
    getPage(fullURL).then((dom) => {
      let fetchresults = Array.from(dom.querySelectorAll(".mainSongs>.item"));

      // fetchresults.forEach((el) => {
      //   console.log(el.querySelector(".desc"));
      // });
      let result = fetchresults.find((el) => {
        let temp = el
          .querySelector(".desc>h3 .track")
          .textContent.toLowerCase();
        // Ищем что то другое если нарвались на рускую песню !!!!!!!!!!!!!!!!!!!! СУПЕР ВАЖНО
        if (temp.includes("rus")) {
          console.log(
            "WARNING RUSSION OPENING ADAPTATION!!!!!!!!!!!!!   " + songName
          );
          return false;
        }
        if (temp.includes("instrumental")) {
          console.log(
            "WARNING INSTRUMENTAL OPENING ADAPTATION!!!!!!!!!!!!!   " + songName
          );
          return false;
        }
        return temp.includes(songName);
      });

      if (result == undefined) {
        if (fetchresults.length > 0) {
          console.log(originalName + "  --  " + songName);
          // console.error(
          //   "Нет точного совпадения по названию. Пробую оригинальное название если оно есть."
          // );
          if (originalName != null) {
            result = fetchresults.find((el) => {
              let temp = el
                .querySelector(".desc>h3 .track")
                .textContent.toLowerCase();
              // Ищем что то другое если нарвались на рускую песню !!!!!!!!!!!!!!!!!!!! СУПЕР ВАЖНО
              if (temp.includes("rus")) {
                console.log(
                  "WARNING RUSSION OPENING ADAPTATION!!!!!!!!!!!!!   " +
                    originalName
                );
                return false;
              }
              if (temp.includes("instrumental")) {
                console.log(
                  "WARNING INSTRUMENTAL OPENING ADAPTATION!!!!!!!!!!!!!   " +
                    originalName
                );
                return false;
              }
              return temp.includes(originalName);
            });
          } else {
            // console.error(
            //   "Нет совпадений и оригинального названия.Беру первое найденнное.Может попадет" +
            //     fullURL +
            //     " " +
            //     originalName
            // );
            reject({ type: 0, text: "no song found" });
            // result = fetchresults[0];
          }
        } else {
          // console.error("Тaкой песни нет   --  " + fullURL);
          reject({ type: 0, text: "no song found" });
        }
      }
      let musicUrl = result
        .querySelector(".actions .play")
        .getAttribute("data-url");

      console.log(musicUrl);
      resolve(musicUrl);
    });
  });
}

onMounted(() => {
  loadMal();
  // parseMUZOFOND("Uso", "SID");
  // parseMUZOFOND("LET IT OUT", "Miho Fukuhara");
  // parseMUZOFOND("Tsunaida Te", "Lil'B");
  // parseMUZOFOND("Shunkan Sentimental", "SCANDAL");
  // parseMUZOFOND("RAY OF LIGHT", "Nakagawa Shouko");
  // parseMUZOFOND("Rain", "SID");
  // parseMUZOFOND("Hologram", "NICO Touches the Walls");
  // parseMUZOFOND("Tsunaida Te", "Lil'B");
  // parseMUZOFOND("Tsunaida Te", "Lil'B");
  // parseMUZOFOND("Tsunaida Te", "Lil'B");
  // parseMUZOFOND("Tsunaida Te", "Lil'B");
});
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

.persent {
  text-align: center;
}

.song {
  display: flex;
  justify-content: space-between;
}
.song + .song {
  margin-top: 20px;
}
</style>
