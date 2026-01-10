// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Capture the visible tab
    const screenshotDataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    
    // Inject the CSS first
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['overlay.css']
    });
    
    // Inject Fabric.js and content script sequentially
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['lib/fabric.min.js']
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    // Send the screenshot to the content script
    await chrome.tabs.sendMessage(tab.id, {
      action: 'initOverlay',
      screenshot: screenshotDataUrl,
      pageUrl: tab.url,
      pageTitle: tab.title
    });
  } catch (error) {
    console.error('BugFinder: Failed to capture screenshot', error);
  }
});

// Handle download requests from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'download') {
    chrome.downloads.download({
      url: message.url,
      filename: message.filename,
      saveAs: message.saveAs || false
    }).then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }
});
