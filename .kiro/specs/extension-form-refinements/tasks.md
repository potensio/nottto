# Implementation Plan: Extension Form Refinements

## Overview

This implementation plan breaks down the Chrome extension form refinements into discrete coding tasks. Each task builds incrementally on previous work, ensuring the form remains functional throughout development.

## Tasks

- [x] 1. Implement workspace auto-selection and persistence

  - [x] 1.1 Update workspace-selector.ts to auto-select first workspace when no saved selection exists
    - Modify `initWorkspaceSelector()` to check for saved selection first
    - If no valid saved selection, auto-select first workspace from list
    - Save the auto-selected workspace to storage
    - Trigger project selector initialization
    - _Requirements: 1.1, 1.2, 1.3, 2.2, 2.3_
  - [ ]\* 1.2 Write property test for workspace initialization
    - **Property 1: Workspace Initialization Correctness**
    - **Validates: Requirements 1.1, 1.2, 1.3, 2.2, 2.3**
  - [ ]\* 1.3 Write unit tests for workspace auto-selection edge cases
    - Test empty workspace list
    - Test saved selection that no longer exists
    - _Requirements: 1.1, 2.3_

- [x] 2. Restructure project row layout

  - [x] 2.1 Move create project button next to Project label in overlay.ts
    - Update HTML structure in `createOverlay()` function
    - Place button inside the label div with compact styling class
    - Remove button from project container area
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 2.2 Add CSS styles for inline create button
    - Create `.bf-create-btn-inline` class with compact sizing
    - Style hover and disabled states
    - Ensure icon scales appropriately
    - _Requirements: 3.2_

- [x] 3. Style project creation form as card

  - [x] 3.1 Update create project form HTML structure in overlay.ts
    - Wrap form in card container div
    - Apply card styling classes
    - Adjust input width for alignment
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 3.2 Add CSS styles for project creation card
    - Create `.bf-create-project-card` class with grey background and rounded corners
    - Create `.bf-input-compact` class for smaller input
    - Create `.bf-btn-sm` classes for compact action buttons
    - _Requirements: 4.2, 4.4_

- [x] 4. Remove reported by section

  - [x] 4.1 Remove reported by row HTML from overlay.ts
    - Delete the "Reported by" row div from form body
    - _Requirements: 5.1_
  - [x] 4.2 Remove updateReporterDisplay function from form-header.ts
    - Remove the function and its call in initFormHeader
    - _Requirements: 5.1, 5.2_

- [x] 5. Update description input styling

  - [x] 5.1 Update description placeholder text in overlay.ts
    - Change placeholder to more helpful guidance text
    - _Requirements: 6.1_
  - [x] 5.2 Update description input CSS for transparent background
    - Set default background to transparent
    - Add focus state with subtle background color
    - Maintain border styling
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 6. Increase title input font size

  - [x] 6.1 Update title input styling in overlay.ts and CSS
    - Change font size class from text-xl to text-2xl or larger
    - Ensure line height is appropriate
    - Verify auto-resize still works
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 7. Checkpoint - Verify all changes
  - Ensure all tests pass, ask the user if questions arise.
  - Build extension and verify visual changes
  - Test workspace selection flow end-to-end

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation order ensures the form remains functional throughout
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
