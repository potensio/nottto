# Design Document: BugFixes - Capture & Toolbar

## Overview

This design addresses four bugs in the BugFinder Chrome extension:

1. Unreliable screen capture that sometimes produces white/blank images
2. Toolbar positioning that should be relative to the canvas container, not the image
3. Second capture showing white/blank image due to improper state cleanup
4. ESC key not working after closing and reopening the overlay

The fixes involve improving the capture flow in `background.js`, restructuring the toolbar positioning in `content.js`, and implementing proper state management for repeated capture sessions.

## Architecture

The existing architecture remains largely unchanged. The fixes target:

```
┌─────────────────────────────────────────────────────────────┐
│                     background.js                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Screen Capture Flow (MODIFIED)                      │    │
│  │  - Tab validation                                    │    │
│  │  - Document ready state check                        │    │
│  │  - Capture with proper error handling                │    │
│  │  - Cleanup existing overlay before new capture       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      content.js                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Overlay UI (MODIFIED)                               │    │
│  │  - Canvas container with relative positioning        │    │
│  │  - Toolbar anchored to canvas bottom                 │    │
│  │  - Proper state cleanup on close                     │    │
│  │  - Single message listener with cleanup handling     │    │
│  │  - Keyboard handler with proper registration         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Component 1: Enhanced Screen Capture (background.js)

The capture flow will be enhanced with:

1. **Tab Validation**: Check if tab is valid for capture (not chrome://, not discarded)
2. **Document Ready Check**: Inject a script to verify document.readyState is "complete"
3. **Proper Error Handling**: Wrap capture in try-catch with user notification

```javascript
// Tab validation helper
function isValidTab(tab) {
  if (!tab || !tab.id) return false;
  if (tab.url?.startsWith("chrome://")) return false;
  if (tab.url?.startsWith("chrome-extension://")) return false;
  if (tab.url?.startsWith("about:")) return false;
  if (tab.discarded) return false;
  return true;
}

// Wait for document ready
async function waitForDocumentReady(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => document.readyState,
  });

  if (results[0]?.result !== "complete") {
    // Wait a bit and check again
    await new Promise((resolve) => setTimeout(resolve, 100));
    return waitForDocumentReady(tabId);
  }
  return true;
}
```

### Component 2: Canvas-Relative Toolbar (content.js)

The toolbar positioning will be changed from absolute positioning relative to the image wrapper to being part of the canvas container's flex layout.

Current structure (problematic):

```html
<div class="canvas-wrapper relative">
  <canvas id="bf-fabric-canvas"></canvas>
  <!-- Toolbar positioned with -bottom-15, can overflow incorrectly -->
  <div class="absolute -bottom-15 left-1/2 ...toolbar..."></div>
</div>
```

New structure (fixed):

```html
<div class="canvas-area flex flex-col items-center">
  <div class="canvas-wrapper relative">
    <canvas id="bf-fabric-canvas"></canvas>
  </div>
  <!-- Toolbar as sibling, naturally flows below canvas -->
  <div class="toolbar mt-4 ...toolbar..."></div>
</div>
```

### Component 3: State Management for Repeated Captures (content.js)

The content script will be restructured to handle repeated captures properly:

1. **Remove IIFE Pattern**: Move away from the immediately-invoked function expression that creates closure issues
2. **Global State with Cleanup**: Use window-level state that can be properly cleaned up
3. **Single Message Listener**: Register the message listener once and handle cleanup within it
4. **Proper Keyboard Handler Management**: Store handler reference for proper removal

```javascript
// Use window-level state instead of closure variables
window.bugfinderState = window.bugfinderState || {
  fabricCanvas: null,
  overlay: null,
  keyboardHandler: null,
  isInitialized: false,
};

// Cleanup function that fully resets state
function cleanupOverlay() {
  const state = window.bugfinderState;

  if (state.fabricCanvas) {
    state.fabricCanvas.off();
    state.fabricCanvas.dispose();
    state.fabricCanvas = null;
  }

  if (state.overlay) {
    state.overlay.remove();
    state.overlay = null;
  }

  if (state.keyboardHandler) {
    document.removeEventListener("keydown", state.keyboardHandler);
    state.keyboardHandler = null;
  }

  document.body.style.overflow = "";
  state.isInitialized = false;
}

// Message listener registered once, handles cleanup internally
if (!window.bugfinderListenerRegistered) {
  window.bugfinderListenerRegistered = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "initOverlay") {
      // Clean up any existing overlay first
      cleanupOverlay();

      // Initialize new overlay
      initializeOverlay(message);
      sendResponse({ success: true });
    }
    return true;
  });
}
```

### Component 4: Keyboard Handler Management (content.js)

The keyboard handler will be stored as a reference and properly managed:

```javascript
function setupKeyboardHandler() {
  const state = window.bugfinderState;

  // Remove existing handler if any
  if (state.keyboardHandler) {
    document.removeEventListener("keydown", state.keyboardHandler);
  }

  // Create and store new handler
  state.keyboardHandler = function handleKeyboard(e) {
    // Skip if in input/textarea
    if (
      e.target.tagName === "TEXTAREA" ||
      (e.target.tagName === "INPUT" && e.target.type === "text")
    ) {
      return;
    }

    // Skip if editing text in Fabric
    if (state.fabricCanvas?.getActiveObject()?.isEditing) {
      return;
    }

    if (e.key === "Escape") {
      cleanupOverlay();
    }
    // ... other shortcuts
  };

  document.addEventListener("keydown", state.keyboardHandler);
}
```

## Data Models

No new data models are required. The existing screenshot data URL format and task object structure remain unchanged.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Tab Validation Correctness

_For any_ tab object, the `isValidTab` function SHALL return `false` if the tab URL starts with "chrome://", "chrome-extension://", or "about:", or if the tab is discarded, or if the tab/tab.id is null/undefined. Otherwise it SHALL return `true`.

**Validates: Requirements 1.5**

### Property 2: Document Ready State Check

_For any_ document ready state value, the ready check function SHALL only proceed with capture when the state equals "complete". For states "loading" or "interactive", it SHALL wait and retry.

**Validates: Requirements 1.3**

### Property 3: State Cleanup Completeness

_For any_ overlay session, when `cleanupOverlay` is called, ALL state variables (fabricCanvas, overlay, keyboardHandler, screenshotDataUrl, activeObject, isDrawing) SHALL be reset to their initial values, and the overlay DOM element SHALL be removed from the document.

**Validates: Requirements 3.2, 3.4**

### Property 4: Duplicate Prevention

_For any_ sequence of content script injections, the message listener SHALL be registered exactly once, and subsequent injections SHALL reuse the existing listener without creating duplicates.

**Validates: Requirements 3.3, 4.3**

### Property 5: Keyboard Handler Input Field Check

_For any_ keyboard event where the target is a TEXTAREA or text INPUT element, the keyboard handler SHALL NOT trigger overlay close or other shortcuts.

**Validates: Requirements 4.4**

### Property 6: Capture Failure Handling

_For any_ capture attempt that returns null, undefined, or empty data, the Screen_Capture_Module SHALL log an error and NOT proceed with script injection.

**Validates: Requirements 1.4**

## Error Handling

### Screen Capture Errors

| Error Condition                        | Handling                            |
| -------------------------------------- | ----------------------------------- |
| Invalid tab (chrome://, discarded)     | Log warning, do not attempt capture |
| Tab not ready (document still loading) | Wait and retry up to 10 times       |
| captureVisibleTab fails                | Log error, show user notification   |
| Script injection fails                 | Log error, show user notification   |
| Capture returns null/empty data        | Log error, do not proceed           |

### State Management Errors

| Error Condition                | Handling                         |
| ------------------------------ | -------------------------------- |
| Existing overlay present       | Clean up before creating new one |
| Fabric canvas disposal fails   | Log warning, continue cleanup    |
| Keyboard handler removal fails | Log warning, continue cleanup    |

### Error Notification

When capture fails, the extension will use `console.error` for logging and optionally show a browser notification to inform the user.

## Testing Strategy

### Unit Tests

1. **Tab Validation Tests**
   - Test `isValidTab` with various tab objects (valid URLs, chrome:// URLs, discarded tabs, null tabs)
2. **DOM Structure Tests**
   - Verify toolbar is positioned correctly relative to canvas container
3. **State Cleanup Tests**
   - Verify all state variables are reset after cleanup
   - Verify overlay DOM is removed
4. **Keyboard Handler Tests**
   - Verify handler skips input fields
   - Verify ESC triggers cleanup

### Property-Based Tests

Property-based tests will use a JavaScript PBT library (fast-check) to verify:

1. **Property 1**: Tab validation function correctly handles all tab state combinations
2. **Property 2**: Document ready state logic correctly identifies ready vs not-ready states
3. **Property 3**: State cleanup resets all variables to initial values
4. **Property 4**: Message listener is registered exactly once
5. **Property 5**: Keyboard handler respects input field focus
6. **Property 6**: Capture failure handling prevents script injection

Each property test will run minimum 100 iterations with randomly generated inputs.

### Integration Tests

Manual testing in Chrome to verify:

- Screen capture works on various page types
- Toolbar stays anchored to canvas on different screen sizes
- Repeated captures work correctly (close and reopen)
- ESC key works on first and subsequent sessions
- No duplicate overlays or event listeners
