# Implementation Plan: Drawing Experience Improvements

## Overview

This plan implements seven improvements to the Nottto drawing experience: visible color picker, proper text font/weight settings, delete button state management, object selectability fixes, Esc key behavior changes, text size options, and auto-switch to Select mode. The implementation modifies `content.js` for logic and `src/input.css` for styling.

## Tasks

- [x] 1. Implement visible color picker in toolbar

  - [x] 1.1 Update toolbar HTML to move color picker into visible position
    - Move color picker from hidden position to toolbar between text controls and action buttons
    - Add proper title attribute for accessibility
    - _Requirements: 1.1_
  - [x] 1.2 Add CSS styling for color picker
    - Create `.bf-color-picker` class in `src/input.css`
    - Style to match toolbar aesthetic (rounded, proper sizing)
    - _Requirements: 1.1_
  - [ ]\* 1.3 Write unit test for color picker visibility
    - Verify color picker element exists and is visible after toolbar init
    - _Requirements: 1.1_

- [x] 2. Implement color application for all object types

  - [x] 2.1 Verify color is applied to arrows (line and head)
    - Review `onMouseUp` arrow finalization to ensure color is used
    - _Requirements: 1.3_
  - [x] 2.2 Verify color is applied to rectangles and ellipses
    - Review `onMouseDown` shape creation to ensure color is used
    - _Requirements: 1.4, 1.5_
  - [x] 2.3 Update text creation to use selected color
    - Modify `addText` function to use color picker value
    - _Requirements: 1.6_
  - [x] 2.4 Ensure `updateContextStyles` updates selected object colors
    - Verify function handles all object types (text, rect, ellipse, arrow group)
    - _Requirements: 1.7_
  - [ ]\* 2.5 Write property test for color application
    - **Property 1: New Objects Use Selected Color**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**

- [x] 3. Implement text font and weight settings

  - [x] 3.1 Update `addText` to use actual font size from selector
    - Replace calculated font size with direct value from `bf-font-size` selector
    - _Requirements: 2.1_
  - [x] 3.2 Implement font weight mapping based on stroke weight
    - Create mapping: Thin(2)→400, Medium(4)→600, Thick(6)→700
    - Apply mapped font weight to new text objects
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
  - [ ]\* 3.3 Write property test for font size
    - **Property 2: Text Font Size Matches Selection**
    - **Validates: Requirements 2.1**
  - [ ]\* 3.4 Write property test for font weight mapping
    - **Property 3: Text Font Weight Mapping**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

- [x] 4. Checkpoint - Verify color and text settings work

  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement delete button state management

  - [x] 5.1 Create `updateDeleteButtonState` function
    - Check if canvas has active object
    - Enable/disable button based on selection state
    - _Requirements: 3.2, 3.3, 3.4_
  - [x] 5.2 Add disabled styling for delete button
    - Add `.bf-tool-btn.disabled` class to CSS
    - Apply opacity-50 and cursor-not-allowed when disabled
    - _Requirements: 3.5_
  - [x] 5.3 Initialize delete button as disabled
    - Call `updateDeleteButtonState` after canvas init
    - Set initial disabled state in HTML
    - _Requirements: 3.1_
  - [x] 5.4 Hook up canvas selection events
    - Add `selection:created` event listener to enable button
    - Add `selection:cleared` event listener to disable button
    - Add `object:removed` event listener to update state
    - _Requirements: 3.3, 3.4, 3.7_
  - [x] 5.5 Update delete button click handler
    - Only delete if button is enabled and object is selected
    - Update button state after deletion
    - _Requirements: 3.6_
  - [ ]\* 5.6 Write property test for delete button state
    - **Property 4: Delete Button State Reflects Selection**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.7**
  - [ ]\* 5.7 Write property test for delete functionality
    - **Property 5: Delete Removes Selected Object**
    - **Validates: Requirements 3.6**

- [x] 6. Implement object selectability fix

  - [x] 6.1 Update onMouseUp to make shapes selectable after creation
    - Set `selectable: true` and `evented: true` on rect/ellipse after drawing completes
    - Call `setCoords()` to ensure selection handles work
    - _Requirements: 4.1, 4.5_
  - [x] 6.2 Update arrow group creation to be selectable
    - Set `selectable: true` and `evented: true` on arrow group after creation
    - _Requirements: 4.1, 4.5_
  - [x] 6.3 Ensure text remains selectable after editing
    - Verify text object has `selectable: true` after `exitEditing()`
    - _Requirements: 4.4_
  - [ ]\* 6.4 Write property test for object selectability
    - **Property 6: Objects Are Selectable After Creation**
    - **Validates: Requirements 4.1, 4.2, 4.5**

- [x] 7. Implement Escape key behavior change

  - [x] 7.1 Update keyboard handler to not close extension on Esc
    - Remove `cleanupOverlay()` call from Esc handler
    - _Requirements: 5.4_
  - [x] 7.2 Implement Esc to clear selection
    - If object is selected, call `discardActiveObject()`
    - If text is being edited, call `exitEditing()` first
    - _Requirements: 5.1, 5.3_
  - [ ]\* 7.3 Write property test for Esc clears selection
    - **Property 7: Escape Key Clears Selection**
    - **Validates: Requirements 5.1, 5.3, 5.4**
  - [ ]\* 7.4 Write property test for Esc never closes extension
    - **Property 8: Escape Key Never Closes Extension**
    - **Validates: Requirements 5.2, 5.4**

- [x] 8. Update text size options

  - [x] 8.1 Add 12px and 14px options to font size selector
    - Update HTML in `createOverlay()` to include new options
    - _Requirements: 6.1, 6.2_
  - [x] 8.2 Change default text size to 16px
    - Set `selected` attribute on 16px option instead of 20px
    - _Requirements: 6.3_
  - [x] 8.3 Ensure options are in ascending order
    - Order: 12px, 14px, 16px, 20px, 24px, 32px
    - _Requirements: 6.4_
  - [ ]\* 8.4 Write unit test for font size options
    - Verify all options exist and 16px is default
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 9. Implement auto-switch to Select mode

  - [x] 9.1 Create helper function for switching to Select and selecting object
    - Function `switchToSelectAndSelect(obj)` that calls `selectTool('select')` and sets active object
    - _Requirements: 7.5_
  - [x] 9.2 Call auto-switch after shape creation in onMouseUp
    - After rect/ellipse/arrow creation completes, call `switchToSelectAndSelect()`
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 9.3 Add text:editing:exited event listener for text auto-switch
    - Listen for `text:editing:exited` event and call `switchToSelectAndSelect()`
    - _Requirements: 7.4_
  - [ ]\* 9.4 Write property test for auto-switch after shapes
    - **Property 9: Auto-Switch to Select Mode After Object Creation**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5**
  - [ ]\* 9.5 Write property test for auto-switch after text
    - **Property 10: Auto-Switch to Select Mode After Text Editing**
    - **Validates: Requirements 7.4, 7.5**

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
