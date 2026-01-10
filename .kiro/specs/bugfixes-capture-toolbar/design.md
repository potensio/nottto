# Design Document: BugFixes Capture Toolbar

## Overview

This design addresses four UI/UX improvements for the BugFinder Chrome extension's annotation overlay:

1. Canvas horizontal padding and image adaptation
2. Multi-line annotation titles
3. Borderless form inputs
4. Canvas-relative toolbar positioning (40px offset)

All changes are CSS and HTML modifications within `content.js` and `src/input.css`.

## Architecture

The existing architecture remains unchanged. The overlay consists of:

- Left panel: Canvas area with Fabric.js canvas and floating toolbar
- Right panel: Form panel with annotation fields

Changes are localized to:

- `content.js`: HTML structure modifications in `createOverlay()` function
- `src/input.css`: Tailwind component class updates
- `initFabric()`: Canvas sizing calculations

## Components and Interfaces

### Canvas Container Layout

Current structure:

```html
<div class="flex-1 flex items-center justify-center p-10 relative z-20">
  <div class="flex flex-col items-center">
    <div class="relative bg-white rounded-xl ...">
      <canvas id="bf-fabric-canvas">
    </div>
    <div class="mt-4 ..."> <!-- Toolbar -->
    </div>
  </div>
</div>
```

Modified structure adds explicit horizontal padding and constrains canvas width:

```html
<div class="flex-1 flex items-center justify-center px-16 py-10 relative z-20">
  <div class="flex flex-col items-center w-full max-w-full">
    <div class="relative bg-white rounded-xl max-w-full overflow-hidden">
      <canvas id="bf-fabric-canvas">
    </div>
    <div class="mt-10 ..."> <!-- Toolbar with 40px (mt-10) offset -->
    </div>
  </div>
</div>
```

### Multi-line Title Input

Replace `<input type="text">` with `<textarea>`:

```html
<!-- Before -->
<input
  type="text"
  id="bf-title-input"
  placeholder="Write an annotation title"
  class="w-full p-0 border-none bg-transparent text-xl ..."
/>

<!-- After -->
<textarea
  id="bf-title-input"
  placeholder="Write an annotation title"
  rows="1"
  class="w-full p-0 border-none bg-transparent text-xl resize-none overflow-hidden ..."
></textarea>
```

Auto-resize behavior via JavaScript:

```javascript
const titleInput = document.getElementById("bf-title-input");
titleInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});
```

### Borderless Form Inputs

Update `.bf-select` class in `src/input.css`:

```css
.bf-select {
  @apply px-2 py-1 bg-transparent border-none rounded text-sm text-bf-primary cursor-pointer outline-none;
}
```

Update description textarea styling to remove border:

```html
<textarea id="bf-description-input"
          class="w-full min-h-25 p-3 border-none rounded-lg bg-bf-bg ...">
```

### Toolbar Positioning

The toolbar should be positioned at the bottom of the canvas container area, 40px from the bottom edge. This means using absolute positioning relative to the canvas container, not relative to the screenshot image.

```html
<div class="flex-1 flex items-center justify-center px-16 py-10 relative z-20">
  <!-- Canvas Container - positioned relative for toolbar anchoring -->
  <div class="relative flex flex-col items-center w-full h-full">
    <!-- Canvas Wrapper - centered -->
    <div class="relative bg-white rounded-xl max-w-full overflow-hidden">
      <canvas id="bf-fabric-canvas">
    </div>

    <!-- Floating Toolbar - absolute positioned at bottom of container -->
    <div class="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex items-center ...">
      <!-- Toolbar content -->
    </div>
  </div>
</div>
```

Key changes:

- Parent container has `relative` positioning
- Toolbar uses `absolute bottom-10` (40px from container bottom)
- Toolbar is horizontally centered with `left-1/2 -translate-x-1/2`
- This ensures toolbar stays at bottom of canvas area regardless of image size

## Data Models

No data model changes required. Form values continue to be read from DOM elements on save.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do._

### Property 1: Canvas fits within container bounds

_For any_ screenshot image and viewport size, the Fabric_Canvas dimensions SHALL NOT exceed the parent container dimensions minus horizontal padding.

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: Multi-line title displays completely

_For any_ title text with N lines (where N >= 1), the Annotation_Title_Input height SHALL accommodate all N lines without truncation.

**Validates: Requirements 2.3, 2.4**

### Property 3: Toolbar maintains canvas-container-relative position

_For any_ canvas size and viewport configuration, the Floating_Toolbar SHALL be positioned 40px from the bottom edge of the Canvas_Container (not the image), horizontally centered.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

## Error Handling

No new error conditions introduced. Existing error handling remains unchanged.

## Testing Strategy

### Unit Tests

- Verify textarea element is used for title input
- Verify borderless styling is applied to form elements
- Verify toolbar has correct absolute positioning (bottom-10)

### Property Tests

- **Property 1**: Generate random image dimensions and viewport sizes, verify canvas never exceeds container bounds
- **Property 2**: Generate random multi-line strings, verify textarea height accommodates all lines
- **Property 3**: Generate random canvas sizes, verify toolbar is always 40px from container bottom (not image bottom)

### Manual Testing

- Visual inspection of padding and spacing
- Test multi-line title entry with Enter key
- Test form input focus states
- Test toolbar position with various screenshot sizes
