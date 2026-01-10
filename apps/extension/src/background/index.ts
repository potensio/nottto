// BugFinder Background Service Worker

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
      console.warn("BugFinder: Error checking document ready state", error);
      return false;
    }
  }

  console.warn("BugFinder: Document did not reach ready state within timeout");
  return false;
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // Validate tab before attempting capture
  if (!isValidTab(tab)) {
    console.warn(
      "BugFinder: Cannot capture this page. The extension does not work on browser internal pages."
    );
    return;
  }

  try {
    // Wait for document to be fully loaded before capture
    const isReady = await waitForDocumentReady(tab.id!);
    if (!isReady) {
      console.error(
        "BugFinder: Page did not finish loading. Please try again."
      );
      return;
    }

    // Capture the visible tab
    const screenshotDataUrl = await chrome.tabs.captureVisibleTab({
      format: "png",
    });

    // Validate capture result
    if (!screenshotDataUrl) {
      console.error(
        "BugFinder: Failed to capture screenshot - no data returned"
      );
      return;
    }

    // Inject the CSS first
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id! },
      files: ["dist/overlay.css"],
    });

    // Inject Fabric.js and content script sequentially
    await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      files: ["lib/fabric.min.js"],
    });

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
    console.error("BugFinder: Failed to capture screenshot", error);
  }
});

// Handle download requests from content script
chrome.runtime.onMessage.addListener(
  (
    message: {
      action: string;
      url: string;
      filename: string;
      saveAs?: boolean;
    },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: { success: boolean; error?: string }) => void
  ) => {
    if (message.action === "download") {
      chrome.downloads
        .download({
          url: message.url,
          filename: message.filename,
          saveAs: message.saveAs || false,
        })
        .then(() => sendResponse({ success: true }))
        .catch((err: Error) =>
          sendResponse({ success: false, error: err.message })
        );
      return true; // Keep channel open for async response
    }
  }
);
