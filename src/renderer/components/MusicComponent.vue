<template>
  <div class="song">
    <p>
      {{ musicData.songName + " - " + musicData.authors }}
    </p>
    <!-- <p>{{ url }}</p> -->
    <!-- <p>{{ muzofondURL }}</p> -->
    <p class="percent">{{ downloadPercent }}</p>
    <select
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
    </select>

    <!-- <audio controls>
      <source :src="muzofondurl" type="audio/mpeg" />
      <source :src="osanimeurl" type="audio/mpeg" />
      <source :src="mp3partyurl" type="audio/mpeg" />
    </audio> -->
    <button
      class="download-btn"
      @click="downloadClickHandler"
      v-if="
        muzofondurl != null ||
        osanimeurl != null ||
        youtubeurl != null ||
        mp3partyurl != null
      "
    >
      download
    </button>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import { ipcRenderer } from "../electron";
const props = defineProps(["musicData"]);
let selectValue = ref("");
let downloadPercent = ref(null);

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

function downloadClickHandler() {
  let url;
  if (selectValue.value == "Muzofond") url = muzofondurl;
  else if (selectValue.value == "Mp3partyurl") url = mp3partyurl;
  else if (selectValue.value == "Osanime") url = osanimeurl;
  else if (selectValue.value == "Youtube") url = youtubeurl;
  console.log(url);
  //send download request
  if (url != undefined) {
    let id = makeid(10);
    ipcRenderer.send("download", {
      url: url,
      properties: {
        directory: "C:/Users/Nikolay/Desktop/testest",
        filename: `${props.musicData.authors} - ${props.musicData.songName}.mp3`,
        songName: props.musicData.songName,
        author: props.musicData.authors,
        id: id,
      },
    });
    //Подписываемся на ответ
    window.api.receive(`download_${id}`, (data) => {
      console.log(data);
      if (data.ended) {
        downloadPercent.value = 1;
        window.api.electronIpcRemoveAllListeners(`download_${id}`);
      } else downloadPercent.value = data.state.percent;
    });
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

let muzofondurl = null;
let osanimeurl = null;
let mp3partyurl = null;

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

onMounted(() => {});
// $emit('downloadEmit',{musicData.url, musicData.songName, musicData.authors})
</script>

<style scoped>
.song {
  display: flex;
  /* justify-content: ; */
}
.song + .song {
  margin-top: 20px;
}
.percent {
  margin-left: auto;
  margin-right: 50px;
}
.download-select {
  margin-right: 50px;
}
</style>
