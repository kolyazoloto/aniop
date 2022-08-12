<template>
  <div class="song" v-if="musicData != undefined">
    <p>
      {{ musicData.songName + " - " + musicData.authors }}
    </p>
    <p>{{ muzofondURL }}</p>
    <!-- <select class="download-select">
      <option v-for="(opt, index_opt) in i.url" :key="index_opt">
        {{ opt }}
      </option>
    </select> -->
    <!-- <button class="download-btn" v-if="musicData.url != null" @click="">
      download
    </button> -->
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
const props = defineProps(["musicData"]);

function getPage(url) {
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

    // console.log(fullURL);
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
          // console.log(originalName + "  --  " + songName);
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
      // console.log(result);

      if (result == undefined) {
        reject({ type: 2, text: "no description" });
      }

      let musicUrl = result
        .querySelector(".actions .play")
        .getAttribute("data-url");

      // console.log(musicUrl);
      resolve(musicUrl);
    });
  });
}

// $emit('downloadEmit',{musicData.url, musicData.songName, musicData.authors})
onMounted(() => {});
</script>

<style scoped></style>
