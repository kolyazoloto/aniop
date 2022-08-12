<template>
  <div class="song">
    <p>
      {{ musicData.songName + " - " + musicData.authors }}
    </p>
    <!-- <p>{{ url }}</p> -->
    <!-- <p>{{ muzofondURL }}</p> -->
    <select
      class="download-select"
      v-model="selectValue"
      v-if="muzofondurl != null || osanimeurl != null || youtubeurl != null"
    >
      <option v-if="muzofondurl != null">Muzofond</option>
      <option v-if="osanimeurl != null">Osanime</option>
      <option v-if="youtubeurl != null">Youtube</option>
    </select>
    <button
      class="download-btn"
      @click="downloadClickHandler"
      v-if="muzofondurl != null || osanimeurl != null || youtubeurl != null"
    >
      download
    </button>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
const props = defineProps(["musicData"]);
let selectValue = ref("");

function downloadClickHandler() {
  let url;
  if (selectValue.value == "Muzofond") url = muzofondurl;
  else if (selectValue.value == "Osanime") url = osanimeurl;
  else if (selectValue.value == "Youtube") url = youtubeurl;

  console.log(url);
}
let muzofondurl = await parseMUZOFOND(
  props.musicData.songName,
  props.musicData.authors,
  props.musicData.originalName
);

let osanimeurl = await parseOSANIME(
  props.musicData.songName,
  props.musicData.authors
);
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

    let dom = await getPage(fullURL);
    if (dom == undefined)
      throw { type: 5, text: "cannot get page  " + fullURL };
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
      let dom2 = await getPage(fetchurl);
      if (dom2 == undefined)
        throw { type: 5, text: "cannot get page  " + fetchurl };
      let mp3url = dom2.querySelector(".kopler > a.btn").href;
      let response = await fetch(mp3url);
      if (!response.ok)
        throw { type: 1, text: "Broken url(cannot get music url)" };
      return response.url;
    } else {
      console.error("Тaкой песни нет   --  " + onlySongNameUrl);
      // reject({ type: 0, text: "no song found" });
      throw { type: 0, text: "no song found" };
    }
  } catch (err) {
    console.log(err);
    return null;
  }
}

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
.download-select {
  margin-left: auto;
  margin-right: 50px;
}
</style>
