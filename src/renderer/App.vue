<template>
  <Suspense>
    <!-- component with nested async dependencies -->
    <Main></Main>
    <!-- loading state via #fallback slot -->
    <template #fallback> Loading... </template>
  </Suspense>
</template>

<script setup>
import Main from "./components/Main.vue";
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap");
:root {
  --fonColor: #efefef;
  --secondColor: #d0d6b3;
  --thirdColor: #e6e9d8;
  --accentColor: #bcbf9b;
  --fourColor: #6c6e57;
  --textColor: #0e2206;
}
/* Box sizing rules */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* Remove default margin */
body,
h1,
h2,
h3,
h4,
p,
figure,
blockquote,
dl,
dd {
  margin: 0;
}

/* Remove list styles on ul, ol elements with a list role, which suggests default styling will be removed */
ul[role="list"],
ol[role="list"] {
  list-style: none;
}

/* Set core root defaults */
html:focus-within {
  scroll-behavior: smooth;
}

/* Set core body defaults */
body {
  min-height: 100vh;
  text-rendering: optimizeSpeed;
  line-height: 1.5;
  font-family: "Merriweather", serif;
}

/* A elements that don't have a class get default styles */
a:not([class]) {
  text-decoration-skip-ink: auto;
}

/* Make images easier to work with */
img,
picture {
  max-width: 100%;
  display: block;
}

/* Inherit fonts for inputs and buttons */
input,
button,
textarea,
select {
  font: inherit;
}

::-webkit-scrollbar {
  width: 10px; /* width of the entire scrollbar */
}

::-webkit-scrollbar-track {
  background: var(--thirdColor); /* color of the tracking area */
}

::-webkit-scrollbar-thumb {
  background-color: var(--fourColor); /* color of the scroll thumb */
  border-radius: 20px; /* roundness of the scroll thumb */
  border: 3px solid var(--thirdColor); /* creates padding around scroll thumb */
}

/* Remove all animations, transitions and smooth scroll for people that prefer not to see them */
@media (prefers-reduced-motion: reduce) {
  html:focus-within {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
