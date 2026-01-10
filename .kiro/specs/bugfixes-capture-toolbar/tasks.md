# Implementation Plan: BugFixes - Capture & Toolbar

## Overview

This plan implements fixes for four bugs: unreliable screen capture, incorrect toolbar positioning, white/blank image on repeated captures, and ESC key not working after first use. The implementation modifies `background.js` for capture improvements and `content.js` for state management and toolbar positioning.

## Tasks

- [x] 1. Implement reliable screen capture in background.js

  - [x] 1.1 Add tab validation helper function

    - Create `isValidTab(tab)` function that checks for null tab, null tab.id, chrome:// URLs, chrome-extension:// URLs, about: URLs, and discarded tabs
    - Return false for any invalid condition, true otherwise
    - _Requirements: 1.5_

  - [x] 1.2 Add document ready state check function

    - Create `waitForDocumentReady(tabId)` async function
    - Use chrome.scripting.executeScript to check document.readyState
    - Wait and retry if state is not "complete"
    - _Requirements: 1.3_

  - [x] 1.3 Update main capture flow with validation and error handling
    - Add tab validation check at start of click handler
    - Call waitForDocumentReady before capture
    - Wrap capture in try-catch with proper error logging
    - _Requirements: 1.1, 1.2, 1.4_

- [x] 2. Fix toolbar positioning in content.js

  - [x] 2.1 Restructure canvas area DOM layout

    - Change canvas container to use flex column layout
    - Move toolbar outside the canvas wrapper div
    - Make toolbar a sibling element below the canvas wrapper
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Update toolbar CSS classes
    - Remove absolute positioning classes (-bottom-15, left-1/2, transform)
    - Add margin-top for spacing from canvas
    - Keep floating appearance styles (shadow, background, rounded)
    - _Requirements: 2.1, 2.4_

- [x] 3. Implement state management for repeated captures

  - [x] 3.1 Refactor content.js to use window-level state

    - Replace IIFE pattern with window.bugfinderState object
    - Move all state variables (fabricCanvas, overlay, keyboardHandler, etc.) to window.bugfinderState
    - Initialize state object if not exists
    - _Requirements: 3.2_

  - [x] 3.2 Implement comprehensive cleanup function

    - Create cleanupOverlay function that resets ALL state variables
    - Dispose Fabric canvas properly (off() then dispose())
    - Remove overlay DOM element
    - Remove keyboard event listener using stored reference
    - Reset body overflow style
    - _Requirements: 3.2, 3.4_

  - [x] 3.3 Implement single message listener with cleanup

    - Register message listener only once using window.bugfinderListenerRegistered flag
    - Call cleanupOverlay before initializing new overlay in message handler
    - Remove the bugfinderInjected guard that prevents re-initialization
    - _Requirements: 3.3, 3.1_

- [x] 4. Fix keyboard handler management

  - [x] 4.1 Implement proper keyboard handler registration

    - Store keyboard handler function reference in window.bugfinderState.keyboardHandler
    - Remove existing handler before adding new one in setupKeyboardHandler
    - Ensure handler is removed in cleanupOverlay
    - _Requirements: 4.2, 4.3_

  - [x] 4.2 Verify input field check in keyboard handler
    - Ensure handler checks for TEXTAREA and INPUT[type="text"] targets
    - Ensure handler checks for Fabric IText editing state
    - Skip shortcuts when user is typing
    - _Requirements: 4.4_

- [ ] 5. Checkpoint - Test the fixes
  - Ensure extension loads without errors
  - Test screen capture on various pages
  - Verify toolbar positioning with different screenshot sizes
  - Test repeated captures (close with ESC, capture again)
  - Verify ESC key works on first and subsequent sessions
  - Verify no duplicate overlays or event listeners in DevTools
