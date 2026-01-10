# Implementation Plan: Tailwind Migration

## Overview

Migrate remaining inline CSS styles in the BugFinder Chrome extension to Tailwind CSS utility classes. The implementation follows a configuration-first approach, adding custom utilities before updating the content script.

## Tasks

- [x] 1. Extend Tailwind configuration with custom utilities

  - Add custom `maxHeight.canvas` for viewport-relative canvas sizing
  - Add custom `boxShadow.canvas` for canvas container shadow
  - Add custom `boxShadow.toolbar` for floating toolbar shadow
  - Add custom `backgroundImage.overlay-gradient` for header gradient
  - _Requirements: 1.2, 2.3, 3.2_

- [x] 2. Update content.js to use new Tailwind classes

  - [x] 2.1 Replace gradient header inline style with `bg-overlay-gradient` class
    - Remove `style` attribute from gradient header div
    - Add `bg-overlay-gradient` to className
    - _Requirements: 1.1_
  - [x] 2.2 Replace canvas container inline shadow with `shadow-canvas` class
    - Remove `style` attribute from canvas container div
    - Add `shadow-canvas` to className
    - _Requirements: 2.1_
  - [x] 2.3 Replace floating toolbar inline shadow with `shadow-toolbar` class
    - Remove `style` attribute from floating toolbar div
    - Add `shadow-toolbar` to className
    - _Requirements: 2.2_
  - [x] 2.4 Replace canvas max-height inline style with `max-h-canvas` class
    - Remove `style` attribute from canvas element
    - Add `max-h-canvas` to className
    - _Requirements: 3.1_

- [x] 3. Build and verify CSS output

  - Run `npm run build` to generate updated overlay.css
  - Verify no build errors occur
  - Verify overlay.css contains the new custom utility classes
  - _Requirements: 5.1_

- [ ] 4. Checkpoint - Manual visual verification
  - Load extension in Chrome and verify overlay appearance is unchanged
  - Verify gradient, shadows, and canvas sizing match pre-migration appearance
  - _Requirements: 4.1, 4.2_

## Notes

- All tasks are required for complete migration
- Task 3 must be run after tasks 1 and 2 to generate the CSS
- Task 4 requires manual testing in a Chrome browser with the extension loaded
