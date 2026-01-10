# Requirements Document

## Introduction

This feature improves the drawing experience in the BugFinder annotation tool by adding color selection for objects and text, ensuring text respects font and weight settings, and fixing the trash/delete button to only be enabled when an object is selected.

## Glossary

- **Canvas**: The Fabric.js drawing surface where users create annotations
- **Toolbar**: The floating UI component containing drawing tools and controls
- **Object**: Any drawable element on the canvas (arrow, rectangle, ellipse, text)
- **Color_Picker**: A UI control that allows users to select colors for objects and text
- **Delete_Button**: The trash icon button in the toolbar used to remove selected objects
- **Font_Size_Selector**: The dropdown control for selecting text size
- **Stroke_Weight_Selector**: The dropdown control for selecting line thickness

## Requirements

### Requirement 1: Color Selection for Objects and Text

**User Story:** As a user, I want to change the color of objects and text, so that I can create visually distinct annotations.

#### Acceptance Criteria

1. WHEN the toolbar is displayed, THE Color_Picker SHALL be visible and accessible to the user
2. WHEN a user selects a color from the Color_Picker, THE Canvas SHALL use that color for newly created objects
3. WHEN a user creates a new arrow, THE Canvas SHALL apply the selected color to both the line and arrowhead
4. WHEN a user creates a new rectangle, THE Canvas SHALL apply the selected color to the stroke
5. WHEN a user creates a new ellipse, THE Canvas SHALL apply the selected color to the stroke
6. WHEN a user creates new text, THE Canvas SHALL apply the selected color to the text fill
7. WHEN a user selects an existing object and changes the color, THE Canvas SHALL update that object's color immediately

### Requirement 2: Text Font and Weight Settings

**User Story:** As a user, I want text to respect font size and weight settings, so that I can create annotations with appropriate text styling.

#### Acceptance Criteria

1. WHEN a user selects a font size from the Font_Size_Selector, THE Canvas SHALL use that exact pixel size for newly created text
2. WHEN a user selects a stroke weight, THE Canvas SHALL apply a corresponding font weight to newly created text
3. WHEN text is created with "Thin" stroke weight selected, THE Canvas SHALL render the text with normal (400) font weight
4. WHEN text is created with "Medium" stroke weight selected, THE Canvas SHALL render the text with semi-bold (600) font weight
5. WHEN text is created with "Thick" stroke weight selected, THE Canvas SHALL render the text with bold (700) font weight

### Requirement 3: Delete Button State Management

**User Story:** As a user, I want the delete button to be disabled until I select something, so that I have clear feedback about when deletion is possible.

#### Acceptance Criteria

1. WHEN the overlay is initialized, THE Delete_Button SHALL be in a disabled state
2. WHEN no object is selected on the Canvas, THE Delete_Button SHALL remain disabled
3. WHEN a user selects an object on the Canvas, THE Delete_Button SHALL become enabled
4. WHEN a user deselects all objects on the Canvas, THE Delete_Button SHALL return to disabled state
5. WHEN the Delete_Button is disabled, THE Delete_Button SHALL display with reduced opacity and not respond to clicks
6. WHEN the Delete_Button is enabled and clicked, THE Canvas SHALL remove the currently selected object
7. WHEN the selected object is deleted, THE Delete_Button SHALL return to disabled state
