# Requirements Document

## Introduction

This document specifies requirements for fixing bugs in the BugFinder Chrome extension: unreliable screen capture resulting in white images on subsequent captures, ESC key not working after first use, and incorrect toolbar positioning relative to the canvas.

## Glossary

- **Screen_Capture_Module**: The component in background.js responsible for capturing the visible tab using `chrome.tabs.captureVisibleTab`
- **Overlay_System**: The full-page annotation overlay created by content.js that displays the captured screenshot
- **Floating_Toolbar**: The drawing tools toolbar that should appear anchored to the bottom of the canvas container
- **Canvas_Container**: The wrapper div containing the Fabric.js canvas element
- **Fabric_Canvas**: The Fabric.js canvas instance used for rendering the screenshot and annotations
- **Content_Script_State**: The module-level state variables in content.js that track overlay, canvas, and event listeners

## Requirements

### Requirement 1: Reliable Screen Capture

**User Story:** As a user, I want the screen capture to reliably capture the current page, so that I never see a blank white image when trying to annotate.

#### Acceptance Criteria

1. WHEN the user clicks the extension icon THEN the Screen_Capture_Module SHALL ensure the tab is fully loaded and active before attempting capture
2. WHEN capturing the visible tab THEN the Screen_Capture_Module SHALL use proper async/await handling with the chrome.tabs.captureVisibleTab API to ensure the capture completes
3. WHEN the tab contains dynamic content or is still loading THEN the Screen_Capture_Module SHALL wait for the document ready state to be "complete" before capturing
4. IF the capture fails or returns invalid data THEN the Screen_Capture_Module SHALL log the error and notify the user with a descriptive error message
5. WHEN injecting scripts into the tab THEN the Screen_Capture_Module SHALL verify the tab is in a valid state (not a chrome:// URL, not discarded) before proceeding

### Requirement 2: Canvas-Relative Toolbar Positioning

**User Story:** As a user, I want the drawing toolbar to stay anchored to the bottom of the canvas area, so that I can easily access tools regardless of the screenshot size.

#### Acceptance Criteria

1. THE Floating_Toolbar SHALL be positioned at the bottom of the Canvas_Container with a fixed offset
2. WHEN the canvas is smaller than the viewport THEN the Floating_Toolbar SHALL remain anchored below the canvas, not at the bottom of the viewport
3. WHEN the canvas is resized or the window is resized THEN the Floating_Toolbar SHALL maintain its position relative to the Canvas_Container
4. THE Floating_Toolbar SHALL have a floating appearance with appropriate shadow and background styling

### Requirement 3: Reliable Repeated Capture Sessions

**User Story:** As a user, I want to be able to capture screenshots multiple times in a row, so that I can annotate different parts of a page or retry if I made a mistake.

#### Acceptance Criteria

1. WHEN the user closes the overlay and triggers a new capture THEN the Overlay_System SHALL display the new screenshot correctly
2. WHEN the overlay is closed THEN the Content_Script_State SHALL be fully reset to allow a fresh capture session
3. WHEN the content script is re-injected THEN the Overlay_System SHALL not create duplicate event listeners or DOM elements
4. WHEN a previous overlay exists THEN the Screen_Capture_Module SHALL clean it up before initializing a new one

### Requirement 4: Reliable ESC Key Functionality

**User Story:** As a user, I want to press ESC to close the annotation overlay at any time, so that I can quickly cancel and return to the page.

#### Acceptance Criteria

1. WHEN the user presses ESC THEN the Overlay_System SHALL close the overlay and restore the page to its original state
2. WHEN the overlay is closed and reopened THEN the ESC key handler SHALL continue to function correctly
3. WHEN the content script is re-injected THEN the keyboard event listener SHALL be properly registered without duplicates
4. IF the user is editing text in an input field THEN the ESC key SHALL NOT close the overlay
