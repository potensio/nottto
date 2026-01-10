// Nottto Content Script - Full Page Overlay Annotation
// Modular TypeScript implementation

import { getState } from "./state";
import { createOverlay, cleanupOverlay } from "./overlay";
import { initCanvas } from "./canvas";
import type { InitOverlayMessage } from "../types";

// Register message listener only once
if (!window.notttoListenerRegistered) {
  window.notttoListenerRegistered = true;

  chrome.runtime.onMessage.addListener(
    (
      message: InitOverlayMessage,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: { success: boolean }) => void
    ) => {
      if (message.action === "initOverlay") {
        // Clean up any existing overlay first
        cleanupOverlay();

        // Store page info
        const state = getState();
        state.pageUrl = message.pageUrl;
        state.pageTitle = message.pageTitle;

        // Create and initialize overlay
        createOverlay();
        initCanvas(message.screenshot);

        sendResponse({ success: true });
      }
      return true;
    }
  );
}
