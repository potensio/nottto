// Entry point for auth listener content script
// This runs on web app pages to receive auth tokens via postMessage

import { initAuthListener } from "./auth-listener";

initAuthListener();
console.log("Nottto: Auth listener initialized");
