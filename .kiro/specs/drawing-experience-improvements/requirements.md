# Requirements Document

## Introduction

This feature improves the drawing experience in the BugFinder annotation tool by adding color selection for objects and text, ensuring text respects font and weight settings, fixing the trash/delete button to only be enabled when an object is selected, improving object selectability, fixing Esc key behavior, updating text size options, and auto-switching to Select mode after object creation.

## Glossary

- **Canvas**: The Fabric.js drawing surface where users create annotations
- **Toolbar**: The floating UI component containing drawing tools and controls
- **Object**: Any drawable element on the canvas (arrow, rectangle, ellipse, text)
- **Color_Picker**: A UI control that allows users to select colors for objects and text
- **Delete_Button**: The trash icon button in the toolbar used to remove selected objects
- **Font_Size_Selector**: The dropdown control for selecting text size
- **Stroke_Weight_Selector**: The dropdown control for selecting line thickness
- **Select_Mode**: The tool mode that allows users to click and select existing objects
- **Drawing_Mode**: Any tool mode (arrow, rect, ellipse, text) used to create new objects

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

### Requirement 4: Object Selectability

**User Story:** As a user, I want to be able to select text and objects on the canvas, so that I can modify or delete them after creation.

#### Acceptance Criteria

1. WHEN an object is created on the Canvas, THE Canvas SHALL make that object selectable when in Select_Mode
2. WHEN a user switches to Select_Mode, THE Canvas SHALL enable selection for all existing objects
3. WHEN a user clicks on an object in Select_Mode, THE Canvas SHALL select that object and display selection handles
4. WHEN text editing is completed, THE Canvas SHALL ensure the text object remains selectable
5. WHEN an arrow, rectangle, or ellipse is created, THE Canvas SHALL set selectable and evented properties to true after creation completes

### Requirement 5: Escape Key Behavior

**User Story:** As a user, I want the Esc key to clear my current selection without closing the extension, so that I can deselect objects without losing my work.

#### Acceptance Criteria

1. WHEN a user presses Esc while an object is selected, THE Canvas SHALL deselect the object and clear the selection
2. WHEN a user presses Esc while no object is selected, THE Canvas SHALL take no action (extension remains open)
3. WHEN a user presses Esc while editing text, THE Canvas SHALL exit text editing mode and deselect the text
4. THE Esc key SHALL never close the extension overlay

### Requirement 6: Text Size Options

**User Story:** As a user, I want more text size options including smaller sizes, so that I can create annotations with appropriate text sizing for different contexts.

#### Acceptance Criteria

1. THE Font_Size_Selector SHALL include 12px as an available option
2. THE Font_Size_Selector SHALL include 14px as an available option
3. THE Font_Size_Selector SHALL have 16px as the default selected value
4. THE Font_Size_Selector SHALL display options in ascending order: 12px, 14px, 16px, 20px, 24px, 32px

### Requirement 7: Auto-Switch to Select Mode

**User Story:** As a user, I want the tool to automatically switch to Select mode after I finish creating an object or typing text, so that I can immediately interact with what I just created.

#### Acceptance Criteria

1. WHEN a user finishes drawing a rectangle, THE Toolbar SHALL automatically switch to Select_Mode
2. WHEN a user finishes drawing an ellipse, THE Toolbar SHALL automatically switch to Select_Mode
3. WHEN a user finishes drawing an arrow, THE Toolbar SHALL automatically switch to Select_Mode
4. WHEN a user exits text editing mode, THE Toolbar SHALL automatically switch to Select_Mode
5. WHEN auto-switching to Select_Mode, THE Canvas SHALL make the newly created object selected
