# Implementation Plan: BugFixes Capture Toolbar

## Overview

Implementation of four UI/UX improvements: canvas padding, multi-line titles, borderless inputs, and canvas-relative toolbar positioning.

## Tasks

- [x] 1. Update canvas container layout with horizontal padding

  - Modify `createOverlay()` in `content.js`
  - Add `px-16` horizontal padding to canvas container
  - Add `relative` positioning to parent container for toolbar anchoring
  - Ensure canvas wrapper has `max-w-full` constraint
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implement multi-line annotation title

  - [x] 2.1 Replace title input with textarea
    - Change `<input type="text">` to `<textarea>` in `createOverlay()`
    - Add classes: `resize-none overflow-hidden`
    - Set initial `rows="1"`
    - _Requirements: 2.1, 2.2_
  - [x] 2.2 Add auto-resize behavior for title textarea
    - Add input event listener in `setupEventListeners()`
    - Implement height auto-adjustment on input
    - _Requirements: 2.3, 2.4_

- [x] 3. Apply borderless styling to form inputs

  - [x] 3.1 Update select element styling
    - Modify `.bf-select` class in `src/input.css`
    - Change to `bg-transparent border-none`
    - _Requirements: 3.1, 3.2_
  - [x] 3.2 Update description textarea styling
    - Remove border from description textarea in `createOverlay()`
    - Change `border border-bf-border` to `border-none`
    - _Requirements: 3.1, 3.4_

- [x] 4. Reposition toolbar relative to canvas container

  - Move toolbar to use absolute positioning
  - Add `absolute bottom-10 left-1/2 transform -translate-x-1/2`
  - Remove `mt-4` margin class
  - Ensure parent container has `relative h-full` classes
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Update initFabric canvas sizing

  - Account for new horizontal padding (px-16 = 64px each side)
  - Update viewport width calculation: `window.innerWidth - 360 - 128` (form panel + padding)
  - _Requirements: 1.2, 1.4_

- [ ]\* 6. Checkpoint - Manual testing
  - Test canvas padding with various screenshot sizes
  - Test multi-line title entry with Enter key
  - Test borderless form appearance
  - Test toolbar position with small and large screenshots
  - Ensure all tests pass, ask the user if questions arise

## Notes

- All changes are in `content.js` and `src/input.css`
- No new dependencies required
- Tailwind classes used: `px-16`, `bottom-10`, `resize-none`, `border-none`, `bg-transparent`
