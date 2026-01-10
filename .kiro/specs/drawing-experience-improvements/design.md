# Design Document: Drawing Experience Improvements

## Overview

This design addresses seven improvements to the Nottto annotation tool's drawing experience:

1. Making the color picker visible and functional for changing object/text colors
2. Ensuring text respects font size and weight settings from the toolbar
3. Implementing proper state management for the delete (trash) button
4. Fixing object selectability issues so all objects can be selected after creation
5. Changing Esc key behavior to clear selection instead of closing the extension
6. Adding smaller text size options (12px, 14px) and setting 16px as default
7. Auto-switching to Select mode after creating objects or finishing text

The implementation uses the existing Fabric.js canvas and Tailwind CSS styling, modifying the toolbar UI and event handling logic.

## Architecture

The changes are localized to `content.js` and `src/input.css`:

```
┌─────────────────────────────────────────────────────────────┐
│                     Toolbar Component                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │ Tools   │  │ Color   │  │ Font/   │  │ Actions         │ │
│  │ Select  │  │ Picker  │  │ Stroke  │  │ Undo | Delete   │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Event Handlers                            │
│  • Color change → Update drawing color / selected object    │
│  • Font size change → Store for text creation               │
│  • Selection change → Update delete button state            │
│  • Esc key → Clear selection (never close extension)        │
│  • Object creation complete → Auto-switch to Select mode    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Fabric.js Canvas                          │
│  • Objects created with current color/font settings         │
│  • Selection events trigger button state updates            │
│  • Objects made selectable after creation completes         │
│  • Text editing:exited event triggers mode switch           │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Color Picker UI Component

The hidden color picker will be replaced with a visible color input in the toolbar.

```html
<!-- Current (hidden) -->
<input
  type="color"
  id="bf-color-picker"
  value="#ff3366"
  class="absolute opacity-0 pointer-events-none"
/>

<!-- New (visible in toolbar) -->
<input
  type="color"
  id="bf-color-picker"
  value="#ff3366"
  class="bf-color-picker"
  title="Color"
/>
```

### 2. Delete Button State Management

```javascript
// Function to update delete button state based on selection
function updateDeleteButtonState() {
  const state = window.notttoState;
  const deleteBtn = document.getElementById("bf-clear-btn");
  const hasSelection = state.fabricCanvas?.getActiveObject() != null;

  if (hasSelection) {
    deleteBtn.classList.remove("disabled");
    deleteBtn.disabled = false;
  } else {
    deleteBtn.classList.add("disabled");
    deleteBtn.disabled = true;
  }
}
```

### 3. Text Creation with Font Settings

```javascript
function addText(x, y, color) {
  const state = window.notttoState;
  const fontSize = parseInt(document.getElementById("bf-font-size").value);
  const strokeWeight = parseInt(
    document.getElementById("bf-stroke-width").value
  );

  // Map stroke weight to font weight
  const fontWeightMap = {
    2: 400, // Thin → normal
    4: 600, // Medium → semi-bold
    6: 700, // Thick → bold
  };
  const fontWeight = fontWeightMap[strokeWeight] || 600;

  const text = new fabric.IText("Type here...", {
    left: x,
    top: y,
    fontFamily: "Segoe UI, system-ui, sans-serif",
    fill: color,
    fontSize: fontSize,
    fontWeight: fontWeight,
    // ... other properties
  });
}
```

### 4. Object Selectability Fix

The root cause of selectability issues is that objects are created with `selectable: false` and `evented: false` during drawing, but these properties are not always properly updated after creation completes.

```javascript
// In onMouseUp - after shape/arrow creation completes
function makeObjectSelectable(obj) {
  obj.set({
    selectable: true,
    evented: true,
  });
  obj.setCoords();
}

// After arrow group creation
arrowGroup.set({ selectable: true, evented: true });
state.fabricCanvas.setActiveObject(arrowGroup);

// After rect/ellipse creation
state.activeObject.set({ selectable: true, evented: true });
state.fabricCanvas.setActiveObject(state.activeObject);
```

### 5. Escape Key Handler

```javascript
// In keyboard handler - Esc clears selection, never closes extension
if (e.key === "Escape") {
  e.preventDefault();

  // If editing text, exit editing mode
  const activeObj = state.fabricCanvas?.getActiveObject();
  if (activeObj && activeObj.isEditing) {
    activeObj.exitEditing();
  }

  // Clear any selection
  state.fabricCanvas?.discardActiveObject();
  state.fabricCanvas?.requestRenderAll();

  // Never call cleanupOverlay() - user must use Cancel button
}
```

### 6. Updated Font Size Selector

```html
<select id="bf-font-size" class="bf-text-control" title="Font Size">
  <option value="12">12px</option>
  <option value="14">14px</option>
  <option value="16" selected>16px</option>
  <option value="20">20px</option>
  <option value="24">24px</option>
  <option value="32">32px</option>
</select>
```

### 7. Auto-Switch to Select Mode

```javascript
// Function to switch to select mode and select the object
function switchToSelectAndSelect(obj) {
  selectTool("select");
  if (obj) {
    state.fabricCanvas.setActiveObject(obj);
    state.fabricCanvas.requestRenderAll();
  }
}

// In onMouseUp - after shape creation
switchToSelectAndSelect(state.activeObject);

// For text - listen to editing:exited event
state.fabricCanvas.on("text:editing:exited", function (e) {
  switchToSelectAndSelect(e.target);
});
```

## Data Models

### Font Weight Mapping

| Stroke Weight Value | Stroke Weight Label | Font Weight |
| ------------------- | ------------------- | ----------- |
| 2                   | Thin                | 400         |
| 4                   | Medium              | 600         |
| 6                   | Thick               | 700         |

### Delete Button States

| Canvas State    | Button Enabled | Button Styling                 |
| --------------- | -------------- | ------------------------------ |
| No selection    | false          | opacity-50, cursor-not-allowed |
| Object selected | true           | normal styling                 |

### Font Size Options

| Value | Display | Default |
| ----- | ------- | ------- |
| 12    | 12px    | No      |
| 14    | 14px    | No      |
| 16    | 16px    | Yes     |
| 20    | 20px    | No      |
| 24    | 24px    | No      |
| 32    | 32px    | No      |

### Escape Key Behavior

| Current State     | Esc Action                       |
| ----------------- | -------------------------------- |
| Object selected   | Deselect object                  |
| Text being edited | Exit editing, deselect text      |
| No selection      | No action (extension stays open) |

### Auto-Switch Triggers

| Event                   | Action                               |
| ----------------------- | ------------------------------------ |
| Rectangle draw complete | Switch to Select, select rectangle   |
| Ellipse draw complete   | Switch to Select, select ellipse     |
| Arrow draw complete     | Switch to Select, select arrow group |
| Text editing exited     | Switch to Select, keep text selected |

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: New Objects Use Selected Color

_For any_ color selected in the color picker and _for any_ object type (arrow, rectangle, ellipse, text), when a new object is created, it SHALL have the selected color applied (stroke for shapes, fill for text).

**Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**

### Property 2: Text Font Size Matches Selection

_For any_ font size value selected in the Font_Size_Selector, when new text is created, the text's fontSize property SHALL equal the selected value exactly.

**Validates: Requirements 2.1**

### Property 3: Text Font Weight Mapping

_For any_ stroke weight selection (Thin/Medium/Thick), when new text is created, the text's fontWeight property SHALL equal the mapped value (400/600/700 respectively).

**Validates: Requirements 2.2, 2.3, 2.4, 2.5**

### Property 4: Delete Button State Reflects Selection

_For any_ canvas state, the delete button's enabled state SHALL equal whether an object is currently selected (enabled if selected, disabled if not).

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.7**

### Property 5: Delete Removes Selected Object

_For any_ selected object on the canvas, when the delete button is clicked, the object SHALL be removed from the canvas.

**Validates: Requirements 3.6**

### Property 6: Objects Are Selectable After Creation

_For any_ object type (arrow, rectangle, ellipse, text), after creation completes and the tool switches to Select mode, the object SHALL have `selectable: true` and `evented: true` properties.

**Validates: Requirements 4.1, 4.2, 4.5**

### Property 7: Escape Key Clears Selection

_For any_ canvas state with a selected object (including text in editing mode), pressing Esc SHALL result in no active object on the canvas and the overlay SHALL remain open.

**Validates: Requirements 5.1, 5.3, 5.4**

### Property 8: Escape Key Never Closes Extension

_For any_ canvas state (with or without selection, with or without text editing), pressing Esc SHALL never close the extension overlay.

**Validates: Requirements 5.2, 5.4**

### Property 9: Auto-Switch to Select Mode After Object Creation

_For any_ object type (arrow, rectangle, ellipse), after the drawing operation completes (mouseUp), the current tool SHALL be 'select' and the newly created object SHALL be the active selection.

**Validates: Requirements 7.1, 7.2, 7.3, 7.5**

### Property 10: Auto-Switch to Select Mode After Text Editing

_For any_ text object, when text editing is exited, the current tool SHALL be 'select' and the text object SHALL remain selected.

**Validates: Requirements 7.4, 7.5**

## Error Handling

| Scenario                         | Handling                               |
| -------------------------------- | -------------------------------------- |
| Color picker not found           | Fall back to default color (#ff3366)   |
| Font size selector not found     | Fall back to default size (16px)       |
| Stroke weight selector not found | Fall back to default weight (4/Medium) |
| Delete clicked with no selection | Button is disabled, no action taken    |
| Canvas not initialized           | Guard checks prevent operations        |
| Esc pressed with no canvas       | No action taken                        |
| Text editing exit fails          | Gracefully handle, still switch mode   |

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Color Picker Visibility**: Verify color picker is visible in toolbar after initialization
2. **Initial Delete Button State**: Verify delete button is disabled on overlay init
3. **Disabled Button Styling**: Verify disabled button has correct CSS classes
4. **Font Size Options**: Verify 12px, 14px options exist and 16px is default
5. **Font Size Order**: Verify options are in ascending order

### Property-Based Tests

Property-based tests will use a JavaScript PBT library (fast-check) to verify universal properties:

1. **Property 1**: Generate random colors, create objects, verify color application
2. **Property 2**: Generate font sizes from valid options, create text, verify fontSize
3. **Property 3**: Test all stroke weight values, create text, verify fontWeight mapping
4. **Property 4**: Simulate selection/deselection sequences, verify button state
5. **Property 5**: Create objects, select them, delete, verify removal
6. **Property 6**: Create objects of each type, verify selectable/evented properties
7. **Property 7**: Select objects, press Esc, verify selection cleared and overlay open
8. **Property 8**: Test Esc in various states, verify overlay never closes
9. **Property 9**: Draw shapes, verify auto-switch to select and object selected
10. **Property 10**: Create text, exit editing, verify auto-switch and selection

Each property test will run minimum 100 iterations and be tagged with:

- **Feature: drawing-experience-improvements, Property {N}: {description}**
