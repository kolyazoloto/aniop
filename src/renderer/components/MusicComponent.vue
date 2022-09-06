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

    <Transition name="fade">
      <p
        class="downloadSpeed"
        v-if="downloadPercent > 0 && downloadPercent < 100"
      >
        {{ downloadSpeed }}
        <span>MB/s</span>
      </p>
    </Transition>

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
          :class="{ disable: downloadAllActive }"
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

<script setup>
import { onMounted, ref, inject } from "vue";
import { ipcRenderer } from "../electron";
import "vue3-circle-progress/dist/circle-progress.css";
import CircleProgress from "vue3-circle-progress";

const downloadDir = inject("downloadDir");
const dirFiles = inject("dirFiles");

// download all
const downloadAllActive = inject("downloadAllActive");

const emit = defineEmits(["downloadComplete"]);
const props = defineProps(["musicData", "type"]);
let selectValue = ref("");
let downloadPercent = ref(0);
let downloadSpeed = ref(0);
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
    emit("downloadComplete", { ok: true, type: props.type });
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

  // url = await parseHITSTER(props.musicData.songName, props.musicData.authors);

  let urls = await Promise.all([
    parseOSANIME(props.musicData.songName, props.musicData.authors),
    parseMP3PARTY(props.musicData.songName, props.musicData.authors),
    parseMUZOFOND(
      props.musicData.songName,
      props.musicData.authors,
      props.musicData.originalName
    ),
    parseKACHEVO(props.musicData.songName, props.musicData.authors),
    parseALLMP3SU(props.musicData.songName, props.musicData.authors),
  ]);

  urls = urls.filter((el) => {
    return el !== null;
  });
  let downloadUrl = urls[0];
  console.log(urls);

  // let stats = await Promise.all(
  //   urls.map(async (el) => {
  //     if (el != null) return fetch(el);
  //     else return null;
  //   })
  // );
  // let blobs = [];
  // for (let i of stats) {
  //   if (i != null) blobs.push({ url: i.url, blob: await i.blob() });
  // }
  // blobs.sort((prev, next) => {
  //   // console.log(prev.blob.size - next.blob.size);
  //   return next.blob.size - prev.blob.size;
  // });
  // console.log(blobs);
  // let downloadUrl = blobs[0].url;

  // send download request
  if (urls.length > 0) {
    let id = makeid(10);
    ipcRenderer.send("download", {
      url: downloadUrl,
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
        emit("downloadComplete", { ok: true, type: props.type });
        window.api.electronIpcRemoveAllListeners(`download_${id}`);
      } else {
        downloadSpeed.value = (data.state.speed * 0.00001).toFixed(2);
        downloadPercent.value = Math.round(data.state.percent * 100);
      }
    });
  } else {
    // error
    emit("downloadComplete", { ok: false, type: props.type });
    downloadError.value = true;
  }
}

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
      if (tempSongName.includes("piano")) {
        console.log(
          "WARNING PIANO OPENING ADAPTATION!!!!!!!!!!!!!   " + songName
        );
        return false;
      }
      if (tempSongName.includes("karaoke")) {
        console.log(
          "WARNING KARAOKE OPENING ADAPTATION!!!!!!!!!!!!!   " + songName
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

async function parseALLMP3SU(song, auth, searchOnlyName = false) {
  try {
    let url = "https://allmp3.su/music/";
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
    let fetchresults = Array.from(dom.querySelectorAll(".item-track.song"));
    // console.log(fetchresults);
    let result = fetchresults.find((el) => {
      let tempSongName = el.getAttribute("data-track-title").toLowerCase();
      let tempAuthor = el.getAttribute("data-artist").toLowerCase();
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
      if (tempSongName.includes("piano")) {
        console.log(
          "WARNING PIANO OPENING ADAPTATION!!!!!!!!!!!!!   " + songName
        );
        return false;
      }
      if (tempSongName.includes("karaoke")) {
        console.log(
          "WARNING KARAOKE OPENING ADAPTATION!!!!!!!!!!!!!   " + songName
        );
        return false;
      }
      if (searchOnlyName) {
        return author.includes(tempAuthor.split(" ")[0]);
      }
      return tempSongName.includes(songName);
      //  && tempAuthor.includes(author);
    });
    // if (searchOnlyName) console.log(result);
    if (result != undefined) {
      let musicUrl = "https:" + result.getAttribute("data-file");
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
      return await parseALLMP3SU(song, auth, true);
    } else return null;
  }
}

async function parseKACHEVO(song, auth, searchOnlyName = false) {
  try {
    let url = "https://rum.kachevo.org/search?q=";
    let songName = song.toLowerCase();
    let author = auth.toLowerCase();

    let fullURL =
      url + `${author.replaceAll(" ", "+")}+${songName.replaceAll(" ", "+")}`;
    if (searchOnlyName) fullURL = url + `${songName.replaceAll(" ", "+")}`;
    let dom = await getPage(fullURL);
    if (dom == undefined)
      throw { type: 5, text: "cannot get page  " + fullURL };
    let fetchresults = Array.from(
      dom.querySelectorAll(".playlist-list>.playlist-item")
    );
    // console.log(fetchresults);
    let result = fetchresults.find((el) => {
      let tempSongName = el
        .querySelector(".playlist-item-info>.playlist-item-title>p")
        .textContent.toLowerCase();
      let tempAuthor = el
        .querySelector(".playlist-item-info>.playlist-item-subtitle>p")
        .textContent.toLowerCase();
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
      if (tempSongName.includes("piano")) {
        console.log(
          "WARNING PIANO OPENING ADAPTATION!!!!!!!!!!!!!   " + songName
        );
        return false;
      }
      if (tempSongName.includes("karaoke")) {
        console.log(
          "WARNING KARAOKE OPENING ADAPTATION!!!!!!!!!!!!!   " + songName
        );
        return false;
      }
      if (searchOnlyName) {
        return author.includes(tempAuthor.split(" ")[0]);
      }
      return tempSongName.includes(songName);
      //  && tempAuthor.includes(author);
    });
    // if (searchOnlyName) console.log(result);
    if (result != undefined) {
      let musicUrl = result
        .querySelector(".playlist-item-play")
        .getAttribute("data-url");

      let fetchresponse = await fetch(musicUrl);
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
      return await parseKACHEVO(song, auth, true);
    } else return null;
  }
}

// async function parseHITSTER(song, auth, searchOnlyName = false) {
//   try {
//     let url = "https://rum.kachevo.org/search?q=";
//     let songName = song.toLowerCase();
//     let author = auth.toLowerCase();

//     let fullURL =
//       url + `${author.replaceAll(" ", "+")}+${songName.replaceAll(" ", "+")}`;
//     if (searchOnlyName) fullURL = url + `${songName.replaceAll(" ", "+")}`;

//     let dom = await fetch(
//       "https://api-vk.com/musicandyears.com.php?q=PAINT%20%20I%20Don%27t%20Like%20Mondays.&pjax=true",
//       {
//         headers: {
//           accept: "*/*",
//           "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
//           "sec-ch-ua":
//             '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
//           "sec-ch-ua-mobile": "?0",
//           "sec-ch-ua-platform": '"Windows"',
//           "sec-fetch-dest": "empty",
//           "sec-fetch-mode": "cors",
//           "sec-fetch-site": "cross-site",
//           "x-requested-with": "XMLHttpRequest",
//         },
//         referrer: "https://hitster.fm/",
//         referrerPolicy: "strict-origin-when-cross-origin",
//         body: null,
//         method: "GET",
//         mode: "cors",
//         credentials: "omit",
//       }
//     );
//     let a = await dom.text();
//     console.log(dom);
//     // let dom = await getPage(fullURL);
//     // if (dom == undefined)
//     //   throw { type: 5, text: "cannot get page  " + fullURL };
//     // let fetchresults = Array.from(
//     //   dom.querySelectorAll(".playlist-list>.playlist-item")
//     // );
//     // // console.log(fetchresults);
//     // let result = fetchresults.find((el) => {
//     //   let tempSongName = el
//     //     .querySelector(".playlist-item-info>.playlist-item-title>p")
//     //     .textContent.toLowerCase();
//     //   let tempAuthor = el
//     //     .querySelector(".playlist-item-info>.playlist-item-subtitle>p")
//     //     .textContent.toLowerCase();
//     //   if (tempSongName.includes("rus")) {
//     //     console.log(
//     //       "WARNING RUSSION OPENING ADAPTATION!!!!!!!!!!!!!   " + songName
//     //     );
//     //     return false;
//     //   }
//     //   if (tempSongName.includes("instrumental")) {
//     //     console.log(
//     //       "WARNING INSTRUMENTAL OPENING ADAPTATION!!!!!!!!!!!!!   " + songName
//     //     );
//     //     return false;
//     //   }
//     //   if (searchOnlyName) {
//     //     return author.includes(tempAuthor.split(" ")[0]);
//     //   }
//     //   return tempSongName.includes(songName);
//     //   //  && tempAuthor.includes(author);
//     // });
//     // // if (searchOnlyName) console.log(result);
//     // if (result != undefined) {
//     //   let musicUrl = result
//     //     .querySelector(".playlist-item-play")
//     //     .getAttribute("data-url");

//     //   let fetchresponse = await fetch(musicUrl);
//     //   if (!fetchresponse.ok)
//     //     throw { type: 1, text: "Broken url(cannot get music url)" };

//     //   return musicUrl;
//     // } else {
//     //   console.error("Тaкой песни нет   --  " + fullURL);
//     //   // reject({ type: 0, text: "no song found" });
//     //   throw { type: 0, text: "no song found" };
//     // }
//   } catch (err) {
//     console.log(err);
//     // if (err.type === 0 && !searchOnlyName) {
//     //   return await parseKACHEVO(song, auth, true);
//     // } else return null;
//   }
// }

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
  margin-right: auto;
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
.downloadSpeed {
  font-size: clamp(6px, 1.5vw, 12px);
  line-height: 13px;
  font-weight: 400;
}
.downloadSpeed > span {
  font-size: clamp(5px, 1.3vw, 10px);
}
.percent {
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
