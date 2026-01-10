# Requirements Document

## Introduction

This document specifies requirements for UI/UX improvements in the BugFinder Chrome extension's annotation overlay: canvas padding and image adaptation, multi-line annotation titles, hidden form inputs, and canvas-relative toolbar positioning.

## Glossary

- **Canvas_Container**: The wrapper div containing the Fabric.js canvas element and its parent layout
- **Fabric_Canvas**: The Fabric.js canvas instance used for rendering the screenshot and annotations
- **Floating_Toolbar**: The drawing tools toolbar that appears below the canvas for annotation tools
- **Annotation_Title_Input**: The text input field where users enter the annotation title
- **Form_Panel**: The right-side panel containing the annotation form fields (title, type, priority, description)
- **Hidden_Input**: An HTML input element with type="hidden" used to store form values without visible UI

## Requirements

### Requirement 1: Canvas Horizontal Padding and Image Adaptation

**User Story:** As a user, I want the captured screenshot to have proper horizontal padding and adapt to its container, so that the image doesn't overlap other UI elements and displays correctly within the available space.

#### Acceptance Criteria

1. THE Canvas_Container SHALL have horizontal padding to prevent the screenshot from overlapping adjacent UI elements
2. WHEN the screenshot is displayed THEN the Fabric_Canvas SHALL adapt its dimensions to fit within the parent container boundaries
3. WHEN the viewport is resized THEN the Fabric_Canvas SHALL maintain proper spacing from container edges
4. THE screenshot image SHALL scale proportionally to fit within the available container width minus padding

### Requirement 2: Multi-line Annotation Title

**User Story:** As a user, I want to write annotation titles with more than one line, so that I can provide detailed titles for complex issues.

#### Acceptance Criteria

1. THE Annotation_Title_Input SHALL support multi-line text entry
2. WHEN the user presses Enter in the title field THEN the input SHALL create a new line instead of submitting the form
3. THE Annotation_Title_Input SHALL expand vertically to accommodate multiple lines of text
4. WHEN the title contains multiple lines THEN the Form_Panel SHALL display all lines without truncation

### Requirement 3: Borderless Form Inputs

**User Story:** As a user, I want the form inputs (title, type, priority, description) to have no visible borders, so that the form feels more natural and less cluttered.

#### Acceptance Criteria

1. THE Form_Panel input fields SHALL have no visible borders in their default state
2. THE Form_Panel select elements SHALL have no visible borders in their default state
3. WHEN the user focuses on an input field THEN the field MAY show subtle visual feedback without adding borders
4. THE borderless styling SHALL maintain visual consistency across all form elements (inputs, selects, textareas)

### Requirement 4: Canvas-Relative Toolbar Positioning

**User Story:** As a user, I want the drawing toolbar to be positioned 40px from the bottom of the canvas, so that the toolbar stays visually connected to the canvas regardless of screen size.

#### Acceptance Criteria

1. THE Floating_Toolbar SHALL be positioned 40px below the bottom edge of the Fabric_Canvas
2. WHEN the canvas is smaller than the viewport THEN the Floating_Toolbar SHALL remain anchored relative to the canvas, not the viewport
3. WHEN the canvas is resized THEN the Floating_Toolbar SHALL maintain its 40px offset from the canvas bottom
4. THE Floating_Toolbar positioning SHALL be relative to the Canvas_Container element, not the screen or viewport
