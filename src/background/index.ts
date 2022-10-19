import Background from "./background";

declare global {
  interface Window { background: Background; }
}

const background = new Background();
background.init();