# Implementation Plan: Extension Refactor

## Overview

Refactor the Nottto Chrome extension from flat JavaScript to modular TypeScript architecture. Tasks are ordered to build incrementally, with each step producing working code.

## Tasks

- [x] 1. Setup build tooling and configuration

  - [x] 1.1 Create `tsconfig.json` with Chrome extension settings
    - Target ES2020, moduleResolution bundler, strict mode
    - Include @types/chrome
    - _Requirements: 1.1, 1.5_
  - [x] 1.2 Create `esbuild.config.js` for bundling
    - Content script bundle to dist/content.js
    - Background script bundle to dist/background.js
    - IIFE format, Chrome 100 target
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 1.3 Update `package.json` scripts
    - build:js, build:css, dev, typecheck commands
    - _Requirements: 1.1_
  - [x] 1.4 Move CSS and update Tailwind config
    - Move `src/input.css` to `src/styles/input.css`
    - Update tailwind.config.js content paths
    - Output to `dist/overlay.css`
    - _Requirements: 7.3, 7.4_
  - [x] 1.5 Add `dist/` to `.gitignore`
    - _Requirements: 1.1_

- [x] 2. Create type definitions and utilities

  - [x] 2.1 Create `src/types/index.ts`
    - Define Tool type, NotttoState interface, Task interface
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 2.2 Create `src/utils/icons.ts`
    - Extract all SVG icon strings from content.js
    - Export as typed const object
    - _Requirements: 4.1_
  - [x] 2.3 Create `src/utils/toast.ts`
    - Extract showToast function
    - _Requirements: 4.2_
  - [x] 2.4 Create `src/utils/storage.ts`
    - Chrome storage helpers for auth token
    - _Requirements: 4.3_

- [x] 3. Create content script modules

  - [x] 3.1 Create `src/content/state.ts`
    - Window-level state management
    - getState, createInitialState, resetState functions
    - _Requirements: 2.1_
  - [x] 3.2 Create `src/content/overlay.ts`
    - createOverlay and cleanupOverlay functions
    - HTML template with Tailwind classes
    - _Requirements: 2.2_
  - [x] 3.3 Create `src/content/canvas.ts`
    - initCanvas function with Fabric.js setup
    - Scale calculation and background image
    - _Requirements: 2.3_
  - [x] 3.4 Create `src/content/tools.ts`
    - selectTool, onMouseDown, onMouseMove, onMouseUp
    - addText function
    - switchToSelectAndSelect helper
    - _Requirements: 2.4_
  - [x] 3.5 Create `src/content/form.ts`
    - setupEventListeners function
    - getFormData helper
    - updateContextStyles function
    - _Requirements: 2.5_
  - [x] 3.6 Create `src/content/actions.ts`
    - undo, deleteSelected, updateDeleteButtonState
    - saveTask, clearAnnotations functions
    - _Requirements: 2.6_
  - [x] 3.7 Create `src/content/keyboard.ts`
    - setupKeyboardHandler, removeKeyboardHandler
    - handleKeyboard with shortcut mapping
    - _Requirements: 2.7_
  - [x] 3.8 Create `src/content/index.ts`
    - Entry point that wires all modules
    - Register chrome.runtime.onMessage listener
    - _Requirements: 2.8_

- [x] 4. Checkpoint - Verify content script builds

  - Run `npm run build:js` and verify dist/content.js is created
  - Check for TypeScript errors with `npm run typecheck`
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create background script

  - [x] 5.1 Create `src/background/index.ts`
    - isValidTab, waitForDocumentReady functions
    - chrome.action.onClicked handler
    - chrome.runtime.onMessage handler for downloads
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 6. Create API layer stubs

  - [x] 6.1 Create `src/api/client.ts`
    - Base API client with auth headers
    - apiRequest generic function
    - _Requirements: 6.1_
  - [x] 6.2 Create `src/api/auth.ts`
    - Auth API stub functions
    - _Requirements: 6.2_
  - [x] 6.3 Create `src/api/workspaces.ts`
    - Workspace API stub functions
    - _Requirements: 6.3_
  - [x] 6.4 Create `src/api/projects.ts`
    - Project API stub functions
    - _Requirements: 6.4_
  - [x] 6.5 Create `src/api/annotations.ts`
    - Annotation API stub functions
    - _Requirements: 6.5_

- [x] 7. Update manifest and configs

  - [x] 7.1 Update `manifest.json`
    - Change background.service_worker to `dist/background.js`
    - Update web_accessible_resources to `dist/overlay.css`
    - _Requirements: 7.1_
  - [x] 7.2 Update Tailwind config content paths
    - Include `src/**/*.ts` for class scanning
    - _Requirements: 7.2_

- [x] 8. Checkpoint - Full build and test

  - Run `npm run build` (both JS and CSS)
  - Verify all dist/ files are created
  - Ensure all tests pass, ask the user if questions arise.

- [-] 9. Integration testing

  - [ ] 9.1 Load extension in Chrome
    - Load unpacked from project root
    - Verify no console errors
    - _Requirements: 8.1_
  - [ ] 9.2 Test screenshot capture
    - Click extension icon on a test page
    - Verify overlay appears with screenshot
    - _Requirements: 8.1_
  - [ ] 9.3 Test drawing tools
    - Test arrow, rectangle, ellipse, text tools
    - Verify shapes appear correctly
    - _Requirements: 8.2_
  - [ ] 9.4 Test save functionality
    - Fill form and click Save
    - Verify JSON and PNG downloads
    - _Requirements: 8.3_
  - [ ] 9.5 Test cancel and keyboard shortcuts
    - Test Cancel button closes overlay
    - Test keyboard shortcuts (S, A, R, E, T, Ctrl+Z)
    - _Requirements: 8.4, 8.5_

- [x] 10. Cleanup old files

  - [x] 10.1 Remove old JavaScript files
    - Delete `content.js` and `background.js` from root
    - Delete `overlay.css` from root (now in dist/)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 11. Final checkpoint
  - Verify extension works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks are ordered for incremental progress - each builds on previous
- Fabric.js remains as external lib in `lib/` (not bundled)
- API stubs are placeholders for future backend integration
- Manual integration testing required for Chrome extension functionality
