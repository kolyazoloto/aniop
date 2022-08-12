import { createApp } from "vue";
import App from "./App.vue";
import { ipcRenderer } from "./electron";

const app = createApp(App);

app.mount("#app");
