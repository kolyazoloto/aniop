<template>
  <div class="songBar">
    <div class="songBar__title">
      <p class="songBar__songname">
        {{ musicData.songName }}
      </p>
      <p class="songBar__authors">
        {{ musicData.authors }}
      </p>
    </div>

    <!-- <select
      class="download-select"
      v-model="selectValue"
      v-if="
        muzofondurl != null ||
        osanimeurl != null ||
        youtubeurl != null ||
        mp3partyurl != null
      "
    >
      <option v-if="muzofondurl != null">Muzofond</option>
      <option v-if="mp3partyurl != null">Mp3partyurl</option>
      <option v-if="osanimeurl != null">Osanime</option>
      <option v-if="youtubeurl != null">Youtube</option>
    </select> -->

    <!-- <audio controls>
      <source :src="muzofondurl" type="audio/mpeg" />
      <source :src="osanimeurl" type="audio/mpeg" />
      <source :src="mp3partyurl" type="audio/mpeg" />
    </audio> -->

    <div class="download-btn-wrapper">
      <Transition name="fade" mode="out-in">
        <div class="download-error" key="0" v-if="downloadError">
          <svg viewBox="0 0 24 24">
            <path d="M10 3H14V14H10V3M10 21V17H14V21H10Z" />
          </svg>
        </div>
        <div class="download-finished" v-else-if="downloadFinished" key="1">
          <svg viewBox="0 0 24 24">
            <path
              d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"
            />
          </svg>
        </div>
        <circle-progress
          v-else-if="downloadPercent > 0 && downloadPercent < 100"
          key="2"
          :percent="downloadPercent"
          :size="31"
          :border-width="4"
          :border-bg-width="6"
          :fill-color="'#0e2206'"
          :empty-color="'#bcbf9b'"
          class="circle-progress-bar"
        />
        <button
          v-else-if="downloadPercent == 0"
          key="3"
          class="download-btn"
          @click="downloadClickHandler"
        >
          <svg class="download-btn__downdload-svg" viewBox="0 0 24 24">
            <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
          </svg>
        </button>
      </Transition>
    </div>
  </div>
</template>
<!-- v-if="
        muzofondurl != null ||
        osanimeurl != null ||
        youtubeurl != null ||
        mp3partyurl != null
      " -->
<script setup>
import { onMounted, ref, inject } from "vue";
import { ipcRenderer } from "../electron";
import "vue3-circle-progress/dist/circle-progress.css";
import CircleProgress from "vue3-circle-progress";

const downloadDir = inject("downloadDir");
const dirFiles = inject("dirFiles");

const emit = defineEmits(["downloadComplete"]);
const props = defineProps(["musicData"]);
let selectValue = ref("");
let downloadPercent = ref(0);
let downloadError = ref(false);
let downloadFinished = ref(false);
isDownloadedAtStart();

function isDownloadedAtStart() {
  let isDownloaded = dirFiles.some((el) => {
    let template = `${props.musicData.authors} - ${props.musicData.songName}.mp3`;
    return el === template;
  });
  if (isDownloaded) {
    downloadFinished.value = true;
    emit("downloadComplete", { ok: true });
  }
}

function makeid(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function downloadClickHandler() {
  if (downloadFinished.value) return;
  let url;
  // if (selectValue.value == "Muzofond") url = mp3partyurl;
  // else if (selectValue.value == "Mp3partyurl") url = muzofondurl;
  // else if (selectValue.value == "Osanime") url = osanimeurl;

  url = await parseOSANIME(props.musicData.songName, props.musicData.authors);

  if (url == null) {
    url = await parseMP3PARTY(
      props.musicData.songName,
      props.musicData.authors
    );
  }
  if (url == null) {
    url = await parseMUZOFOND(
      props.musicData.songName,
      props.musicData.authors,
      props.musicData.originalName
    );
  }

  // else if (selectValue.value == "Youtube") url = youtubeurl;
  console.log(url);
  //send download request
  if (url != null && url != undefined) {
    let id = makeid(10);
    ipcRenderer.send("download", {
      url: url,
      properties: {
        directory: downloadDir.value,
        filename: `${props.musicData.authors} - ${props.musicData.songName}.mp3`,
        songName: props.musicData.songName,
        author: props.musicData.authors,
        id: id,
      },
    });
    //Подписываемся на ответ
    window.api.receive(`download_${id}`, (data) => {
      // console.log(data);
      if (data.ended) {
        downloadPercent.value = 100;
        downloadFinished.value = true;
        emit("downloadComplete", { ok: true });
        window.api.electronIpcRemoveAllListeners(`download_${id}`);
      } else downloadPercent.value = Math.round(data.state.percent * 100);
    });
  } else {
    // error
    emit("downloadComplete", { ok: false });
    downloadError.value = true;
  }
}

// let muzofondurl = await parseMUZOFOND(
//   props.musicData.songName,
//   props.musicData.authors,
//   props.musicData.originalName
// );

// let osanimeurl = await parseOSANIME(
//   props.musicData.songName,
//   props.musicData.authors
// );

// let mp3partyurl = await parseMP3PARTY(
//   props.musicData.songName,
//   props.musicData.authors
// );

// let muzofondurl = null;
// let osanimeurl = null;
// let mp3partyurl = null;

let youtubeurl = null;

async function getPage(url) {
  let response = await fetch(url, {
    method: "GET",
  });
  if (!response.ok) return undefined;
  let text = await response.text();
  return new DOMParser().parseFromString(text, "text/html");
}

async function parseMUZOFOND(song, auth, originalName) {
  try {
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
    let dom = await getPage(fullURL);
    if (dom == undefined)
      throw { type: 5, text: "cannot get page  " + fullURL };
    let fetchresults = Array.from(dom.querySelectorAll(".mainSongs>.item"));
    let result = fetchresults.find((el) => {
      let temp = el.querySelector(".desc>h3 .track").textContent.toLowerCase();
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
          throw { type: 0, text: "no song match found" };
        }
      } else {
        throw { type: 0, text: "no song found" };
      }
    }
    if (result == undefined) {
      throw { type: 2, text: "no description" };
    }
    let musicUrl = result
      .querySelector(".actions .play")
      .getAttribute("data-url");

    //проверяем на битость ссылки
    let fetchresponse = await fetch(musicUrl);

    if (!fetchresponse.ok)
      throw { type: 1, text: "Broken url(cannot get music url)" };

    return musicUrl;
  } catch (err) {
    console.log(err);
    return null;
  }
}

async function parseOSANIME(song, auth) {
  try {
    let url = "https://osanime.com/site-search.html?to-search=";
    let siteurl = "https://osanime.com";
    let songName = song.toLowerCase();
    let author = auth.toLowerCase();

    let fullURL =
      url + `${author.replaceAll(" ", "+")}+${songName.replaceAll(" ", "+")}`;
    let backwardsUrl =
      url + `${songName.replaceAll(" ", "+")}+${author.replaceAll(" ", "+")}`;
    let onlySongNameUrl = url + `${songName.replaceAll(" ", "+")}`;
    // console.log(fullURL);
    let dom = await getPage(fullURL);
    if (dom == undefined)
      throw { type: 5, text: "cannot get page  " + fullURL };
    let fetchresults = Array.from(dom.querySelectorAll("article>a"));
    let result = fetchresults.find((el) => {
      let temp = el.querySelector(".vret > a").title.toLowerCase();
      // console.log(temp);
      return temp.includes(songName) && temp.includes(author);
    });
    if (result != undefined) {
      let fetchurl =
        siteurl + result.querySelector(".vret > a").getAttribute("href");
      let dom2 = await getPage(fetchurl);
      if (dom2 == undefined)
        throw { type: 5, text: "cannot get page  " + fetchurl };
      let mp3url = dom2.querySelector(".kopler > a.btn").href;
      let response = await fetch(mp3url);
      if (!response.ok)
        throw { type: 1, text: "Broken url(cannot get music url)" };
      return response.url;
    } else {
      console.error("Тaкой песни нет   --  " + fullURL);
      // reject({ type: 0, text: "no song found" });
      throw { type: 0, text: "no song found" };
    }
  } catch (err) {
    console.log(err);
    return null;
  }
}

async function parseMP3PARTY(song, auth, searchOnlyName = false) {
  try {
    let url = "https://mp3party.net/search?q=";
    let songName = song.toLowerCase();
    let author = auth.toLowerCase();

    let fullURL =
      url +
      `${author.replaceAll(" ", "%20")}%20${songName.replaceAll(" ", "%20")}`;

    if (searchOnlyName) fullURL = url + `${songName.replaceAll(" ", "%20")}`;
    // let backwardsUrl =
    //   url +
    //   `${songName.replaceAll(" ", "%20")}+${author.replaceAll(" ", "%20")}`;
    // let onlySongNameUrl = url + `${songName.replaceAll(" ", "%20")}`;

    let dom = await getPage(fullURL);
    if (dom == undefined)
      throw { type: 5, text: "cannot get page  " + fullURL };
    let fetchresults = Array.from(dom.querySelectorAll(".playlist>.track"));
    // console.log(fetchresults);
    let result = fetchresults.find((el) => {
      let temp = el.querySelector(".track__user-panel");
      let tempSongName = temp.getAttribute("data-js-song-title").toLowerCase();
      let tempAuthor = temp.getAttribute("data-js-artist-name").toLowerCase();
      if (tempSongName.includes("rus")) {
        console.log(
          "WARNING RUSSION OPENING ADAPTATION!!!!!!!!!!!!!   " + songName
        );
        return false;
      }
      if (tempSongName.includes("instrumental")) {
        console.log(
          "WARNING INSTRUMENTAL OPENING ADAPTATION!!!!!!!!!!!!!   " + songName
        );
        return false;
      }
      // console.log([temp, tempSongName, tempAuthor]);
      // console.log(songName);
      // console.log(tempSongName.includes(songName));
      if (searchOnlyName) {
        // console.log([
        //   author,
        //   tempAuthor,
        //   tempAuthor.split(" ")[0],
        //   author.includes(tempAuthor.split(" ")[0]),
        // ]);
        return author.includes(tempAuthor.split(" ")[0]);
      }
      return tempSongName.includes(songName);
      //  && tempAuthor.includes(author);
    });
    // if (searchOnlyName) console.log(result);
    if (result != undefined) {
      let musicUrl = result
        .querySelector(".track__user-panel")
        .getAttribute("data-js-url");

      let musicId = musicUrl.match(/\d{4,}/);
      // Запрос на разрешение песен.Без него не работаю.битые ссылки.
      await fetch("https://mp3party.net/song_permissions/", {
        headers: {
          accept: "application/json",
          "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
          "content-type": "application/json",
          "sec-ch-ua":
            '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
        },
        referrer: "https://mp3party.net/search?q=" + songName,
        referrerPolicy: "strict-origin-when-cross-origin",
        body: `{"ids":["${musicId}"]}`,
        method: "POST",
        mode: "cors",
        credentials: "include",
      });
      let fetchresponse = await fetch(musicUrl);
      // console.log(fetchresponse);
      if (!fetchresponse.ok)
        throw { type: 1, text: "Broken url(cannot get music url)" };

      return musicUrl;
    } else {
      console.error("Тaкой песни нет   --  " + fullURL);
      // reject({ type: 0, text: "no song found" });
      throw { type: 0, text: "no song found" };
    }
  } catch (err) {
    console.log(err);
    if (err.type === 0 && !searchOnlyName) {
      return await parseMP3PARTY(song, auth, true);
    } else return null;
  }
}

defineExpose({ downloadClickHandler });

// $emit('downloadEmit',{musicData.url, musicData.songName, musicData.authors})
</script>

<style scoped>
.songBar {
  position: relative;
  display: flex;
  gap: 16px;
  padding-block: 10px;
  align-items: center;
  /* background-color: var(--thirdColor); */
}
.songBar + .songBar::after {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #00000057, transparent);
}

.songBar__title {
}
.songBar__songname {
  font-weight: 600;
  font-size: clamp(10px, 1.7vw, 16px);
  line-height: 16px;
  margin-bottom: 5px;
}
.songBar__authors {
  font-size: clamp(7px, 1.6vw, 13px);
  line-height: 13px;
  font-weight: 400;
}
.percent {
  margin-left: auto;
  margin-right: 50px;
}
.download-select {
  margin-right: 50px;
}
.download-finished {
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
.download-error {
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
.download-error svg {
  width: 70%;
  height: 70%;
  fill: rgb(218, 51, 51);
}
.download-btn-wrapper {
  margin-left: auto;
  margin-right: 10px;
}
.download-btn {
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
.download-btn:hover {
  background-color: var(--accentColor);
}
.download-btn svg {
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
