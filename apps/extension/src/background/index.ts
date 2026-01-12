// Nottto Background Service Worker
import { hasValidTokens } from "../utils/auth-storage";
import { config } from "../config";

/**
 * Validates if a tab is suitable for screen capture
 */
function isValidTab(tab: chrome.tabs.Tab): boolean {
  if (!tab || !tab.id) return false;
  if (tab.url?.startsWith("chrome://")) return false;
  if (tab.url?.startsWith("chrome-extension://")) return false;
  if (tab.url?.startsWith("about:")) return false;
  if (tab.discarded) return false;
  return true;
}

/**
 * Waits for the document in a tab to be fully loaded
 */
async function waitForDocumentReady(
  tabId: number,
  maxRetries = 10
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => document.readyState,
      });

      if (results[0]?.result === "complete") {
        return true;
      }

      // Wait 100ms before retrying
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.warn("Nottto: Error checking document ready state", error);
      return false;
    }
  }

  console.warn("Nottto: Document did not reach ready state within timeout");
  return false;
}

/**
 * Shows auth prompt in the content script
 */
async function showAuthPromptInTab(tabId: number): Promise<void> {
  try {
    // Inject auth prompt styles and script
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (webUrl: string) => {
        // Create and show auth prompt
        const overlay = document.createElement("div");
        overlay.id = "nottto-auth-prompt";
        overlay.innerHTML = `
          <div class="nottto-auth-backdrop">
            <div class="nottto-auth-modal">
              <div class="nottto-auth-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h2 class="nottto-auth-title">Sign in to Nottto</h2>
              <p class="nottto-auth-description">
                Sign in to save and sync your screenshots across devices.
              </p>
              <button id="nottto-auth-signin-btn" class="nottto-auth-button">
                Sign in
              </button>
              <button id="nottto-auth-close-btn" class="nottto-auth-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        `;

        const style = document.createElement("style");
        style.id = "nottto-auth-prompt-styles";
        style.textContent = `
          .nottto-auth-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
          .nottto-auth-modal {
            background: white;
            border-radius: 16px;
            padding: 32px;
            max-width: 360px;
            width: 90%;
            text-align: center;
            position: relative;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          }
          .nottto-auth-icon {
            width: 64px;
            height: 64px;
            background: #f5f5f5;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: #525252;
          }
          .nottto-auth-title {
            font-size: 24px;
            font-weight: 600;
            color: #171717;
            margin: 0 0 8px;
          }
          .nottto-auth-description {
            font-size: 14px;
            color: #737373;
            margin: 0 0 24px;
            line-height: 1.5;
          }
          .nottto-auth-button {
            width: 100%;
            padding: 12px 24px;
            background: #171717;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
          }
          .nottto-auth-button:hover {
            background: #262626;
          }
          .nottto-auth-close {
            position: absolute;
            top: 12px;
            right: 12px;
            width: 32px;
            height: 32px;
            background: transparent;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #a3a3a3;
            transition: background 0.2s, color 0.2s;
          }
          .nottto-auth-close:hover {
            background: #f5f5f5;
            color: #525252;
          }
        `;

        document.head.appendChild(style);
        document.body.appendChild(overlay);

        const removePrompt = () => {
          document.getElementById("nottto-auth-prompt")?.remove();
          document.getElementById("nottto-auth-prompt-styles")?.remove();
        };

        document
          .getElementById("nottto-auth-signin-btn")
          ?.addEventListener("click", () => {
            window.open(`${webUrl}/auth?source=extension`, "_blank");
            removePrompt();
          });

        document
          .getElementById("nottto-auth-close-btn")
          ?.addEventListener("click", removePrompt);

        overlay
          .querySelector(".nottto-auth-backdrop")
          ?.addEventListener("click", (e) => {
            if (e.target === e.currentTarget) removePrompt();
          });

        document.addEventListener("keydown", function handler(e) {
          if (e.key === "Escape") {
            removePrompt();
            document.removeEventListener("keydown", handler);
          }
        });
      },
      args: [config.WEB_URL],
    });
  } catch (error) {
    console.error("Nottto: Failed to show auth prompt", error);
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // Validate tab before attempting capture
  if (!isValidTab(tab)) {
    console.warn(
      "Nottto: Cannot capture this page. The extension does not work on browser internal pages."
    );
    return;
  }

  // Check if user is authenticated
  const isAuthenticated = await hasValidTokens();
  if (!isAuthenticated) {
    await showAuthPromptInTab(tab.id!);
    return;
  }

  try {
    // Wait for document to be fully loaded before capture
    const isReady = await waitForDocumentReady(tab.id!);
    if (!isReady) {
      console.error("Nottto: Page did not finish loading. Please try again.");
      return;
    }

    // Capture the visible tab
    const screenshotDataUrl = await chrome.tabs.captureVisibleTab({
      format: "png",
    });

    // Validate capture result
    if (!screenshotDataUrl) {
      console.error("Nottto: Failed to capture screenshot - no data returned");
      return;
    }

    // Inject the CSS first
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id! },
      files: ["dist/overlay.css"],
    });

    // Check if Fabric.js is already loaded to prevent duplicate definitions
    const [fabricCheck] = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: () =>
        typeof (window as unknown as { fabric?: unknown }).fabric !==
        "undefined",
    });

    // Only inject Fabric.js if not already loaded
    if (!fabricCheck?.result) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ["lib/fabric.min.js"],
      });
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      files: ["dist/content.js"],
    });

    // Send the screenshot to the content script
    await chrome.tabs.sendMessage(tab.id!, {
      action: "initOverlay",
      screenshot: screenshotDataUrl,
      pageUrl: tab.url,
      pageTitle: tab.title,
    });
  } catch (error) {
    console.error("Nottto: Failed to capture screenshot", error);
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener(
  (
    message: {
      action: string;
      url?: string;
      filename?: string;
      saveAs?: boolean;
      user?: { id: string; email: string; name: string | null };
    },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: { success: boolean; error?: string }) => void
  ) => {
    if (message.action === "download") {
      chrome.downloads
        .download({
          url: message.url!,
          filename: message.filename!,
          saveAs: message.saveAs || false,
        })
        .then(() => sendResponse({ success: true }))
        .catch((err: Error) =>
          sendResponse({ success: false, error: err.message })
        );
      return true; // Keep channel open for async response
    }

    if (message.action === "authComplete") {
      console.log("Nottto: Auth complete for user", message.user?.email);
      sendResponse({ success: true });
      return false;
    }
  }
);
