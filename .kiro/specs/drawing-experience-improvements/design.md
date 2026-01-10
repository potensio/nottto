# Design Document: Drawing Experience Improvements

## Overview

This design addresses three improvements to the BugFinder annotation tool's drawing experience:

1. Making the color picker visible and functional for changing object/text colors
2. Ensuring text respects font size and weight settings from the toolbar
3. Implementing proper state management for the delete (trash) button

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
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Fabric.js Canvas                          │
│  • Objects created with current color/font settings         │
│  • Selection events trigger button state updates            │
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
  const state = window.bugfinderState;
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
  const state = window.bugfinderState;
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

## Error Handling

| Scenario                         | Handling                               |
| -------------------------------- | -------------------------------------- |
| Color picker not found           | Fall back to default color (#ff3366)   |
| Font size selector not found     | Fall back to default size (20px)       |
| Stroke weight selector not found | Fall back to default weight (4/Medium) |
| Delete clicked with no selection | Button is disabled, no action taken    |
| Canvas not initialized           | Guard checks prevent operations        |

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Color Picker Visibility**: Verify color picker is visible in toolbar after initialization
2. **Initial Delete Button State**: Verify delete button is disabled on overlay init
3. **Disabled Button Styling**: Verify disabled button has correct CSS classes

### Property-Based Tests

Property-based tests will use a JavaScript PBT library (fast-check) to verify universal properties:

1. **Property 1**: Generate random colors, create objects, verify color application
2. **Property 2**: Generate font sizes from valid options, create text, verify fontSize
3. **Property 3**: Test all stroke weight values, create text, verify fontWeight mapping
4. **Property 4**: Simulate selection/deselection sequences, verify button state
5. **Property 5**: Create objects, select them, delete, verify removal

Each property test will run minimum 100 iterations and be tagged with:

- **Feature: drawing-experience-improvements, Property {N}: {description}**
