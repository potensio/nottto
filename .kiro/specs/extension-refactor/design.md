# Design Document: Extension Refactor

## Overview

This design transforms the Nottto Chrome extension from a monolithic JavaScript structure to a modular TypeScript architecture. The refactor maintains full functional parity while enabling better maintainability, type safety, and preparation for future backend integration.

## Architecture

```
nottto/
├── manifest.json              # Updated to reference dist/
├── dist/                      # Built output (gitignored)
│   ├── content.js             # Bundled content script
│   ├── background.js          # Bundled background script
│   └── overlay.css            # Built Tailwind CSS
├── src/
│   ├── background/
│   │   └── index.ts           # Background service worker
│   ├── content/
│   │   ├── index.ts           # Content script entry point
│   │   ├── state.ts           # Window-level state management
│   │   ├── overlay.ts         # Overlay UI creation & DOM
│   │   ├── canvas.ts          # Fabric.js canvas initialization
│   │   ├── tools.ts           # Drawing tools (arrow, rect, ellipse, text)
│   │   ├── form.ts            # Right panel form handling
│   │   ├── actions.ts         # Save, undo, delete, clear actions
│   │   └── keyboard.ts        # Keyboard shortcuts handler
│   ├── api/
│   │   ├── client.ts          # Base API client (stub)
│   │   ├── auth.ts            # Auth API (stub)
│   │   ├── workspaces.ts      # Workspace API (stub)
│   │   ├── projects.ts        # Project API (stub)
│   │   └── annotations.ts     # Annotation API (stub)
│   ├── utils/
│   │   ├── storage.ts         # chrome.storage helpers
│   │   ├── icons.ts           # SVG icon strings
│   │   └── toast.ts           # Toast notification helper
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   └── styles/
│       └── input.css          # Tailwind source
├── lib/
│   └── fabric.min.js          # External lib (not bundled)
├── tailwind.config.js
├── tsconfig.json
├── esbuild.config.js
└── package.json
```

## Components and Interfaces

### src/types/index.ts

```typescript
export type Tool = "select" | "arrow" | "rect" | "ellipse" | "text";

export interface NotttoState {
  fabricCanvas: fabric.Canvas | null;
  overlay: HTMLElement | null;
  notesInput: HTMLTextAreaElement | null;
  keyboardHandler: ((e: KeyboardEvent) => void) | null;
  currentTool: Tool;
  isDrawing: boolean;
  startX: number;
  startY: number;
  activeObject: fabric.Object | null;
  pageUrl: string;
  pageTitle: string;
  screenshotDataUrl: string;
  canvasScale: number;
}

export interface Task {
  id: string;
  createdAt: string;
  pageUrl: string;
  pageTitle: string;
  title: string;
  type: string;
  priority: string;
  description: string;
  screenshotOriginal: string;
  screenshotAnnotated: string;
  canvasData: object;
}
```

### src/content/state.ts

```typescript
import { NotttoState, Tool } from "../types";

declare global {
  interface Window {
    notttoState: NotttoState;
    notttoListenerRegistered?: boolean;
  }
}

export function getState(): NotttoState {
  if (!window.notttoState) {
    window.notttoState = createInitialState();
  }
  return window.notttoState;
}

export function createInitialState(): NotttoState {
  return {
    fabricCanvas: null,
    overlay: null,
    notesInput: null,
    keyboardHandler: null,
    currentTool: "arrow",
    isDrawing: false,
    startX: 0,
    startY: 0,
    activeObject: null,
    pageUrl: "",
    pageTitle: "",
    screenshotDataUrl: "",
    canvasScale: 1,
  };
}

export function resetState(): void {
  window.notttoState = createInitialState();
}
```

### src/content/overlay.ts

```typescript
import { getState } from "./state";
import { icons } from "../utils/icons";
import { setupEventListeners } from "./form";
import { setupKeyboardHandler } from "./keyboard";

export function createOverlay(): void {
  const state = getState();
  state.overlay = document.createElement("div");
  state.overlay.id = "nottto-overlay";
  // ... HTML template with Tailwind classes
  document.body.appendChild(state.overlay);
  state.notesInput = document.getElementById(
    "bf-description-input"
  ) as HTMLTextAreaElement;
  setupEventListeners();
  setupKeyboardHandler();
  document.body.style.overflow = "hidden";
}

export function cleanupOverlay(): void {
  const state = getState();
  // Dispose Fabric canvas
  // Remove overlay DOM
  // Remove keyboard handler
  // Reset state
  // Restore page scroll
}
```

### src/content/canvas.ts

```typescript
import { getState } from "./state";
import { selectTool } from "./tools";
import { onMouseDown, onMouseMove, onMouseUp } from "./tools";
import { updateDeleteButtonState } from "./actions";

export function initCanvas(dataUrl: string): void {
  const state = getState();
  state.screenshotDataUrl = dataUrl;

  const img = new Image();
  img.onload = () => {
    // Calculate scale to fit viewport
    // Create Fabric.Canvas
    // Set background image
    // Hook up mouse events
    // Hook up selection events
  };
  img.src = dataUrl;
}

export function getCanvas(): fabric.Canvas | null {
  return getState().fabricCanvas;
}
```

### src/content/tools.ts

```typescript
import { getState } from "./state";
import { Tool } from "../types";

export function selectTool(tool: Tool): void {
  const state = getState();
  state.currentTool = tool;
  // Update UI button states
  // Configure canvas selection mode
}

export function onMouseDown(o: fabric.IEvent): void {
  // Handle tool-specific mouse down
}

export function onMouseMove(o: fabric.IEvent): void {
  // Handle drawing in progress
}

export function onMouseUp(): void {
  // Finalize shape creation
  // Auto-switch to select mode
}

export function addText(x: number, y: number, color: string): void {
  // Create IText object
}
```

### src/content/actions.ts

```typescript
import { getState } from "./state";
import { showToast } from "../utils/toast";
import { cleanupOverlay } from "./overlay";

export function undo(): void {
  const state = getState();
  const objects = state.fabricCanvas?.getObjects();
  if (objects && objects.length > 0) {
    state.fabricCanvas?.remove(objects[objects.length - 1]);
  }
}

export function deleteSelected(): void {
  // Remove active object from canvas
}

export function updateDeleteButtonState(): void {
  // Enable/disable delete button based on selection
}

export async function saveTask(): Promise<void> {
  // Export canvas to PNG
  // Create task JSON
  // Trigger downloads
}
```

### src/content/keyboard.ts

```typescript
import { getState } from "./state";
import { selectTool } from "./tools";
import { undo, deleteSelected } from "./actions";
import { saveTask } from "./actions";

const SHORTCUT_MAP: Record<string, () => void> = {
  s: () => selectTool("select"),
  a: () => selectTool("arrow"),
  r: () => selectTool("rect"),
  e: () => selectTool("ellipse"),
  t: () => selectTool("text"),
};

export function setupKeyboardHandler(): void {
  const state = getState();

  if (state.keyboardHandler) {
    document.removeEventListener("keydown", state.keyboardHandler);
  }

  state.keyboardHandler = handleKeyboard;
  document.addEventListener("keydown", state.keyboardHandler);
}

export function removeKeyboardHandler(): void {
  const state = getState();
  if (state.keyboardHandler) {
    document.removeEventListener("keydown", state.keyboardHandler);
    state.keyboardHandler = null;
  }
}

function handleKeyboard(e: KeyboardEvent): void {
  // Skip if in input/textarea
  // Handle Escape, shortcuts, Ctrl+Z, Delete
}
```

### src/background/index.ts

```typescript
function isValidTab(tab: chrome.tabs.Tab): boolean {
  // Validate tab for capture
}

async function waitForDocumentReady(
  tabId: number,
  maxRetries = 10
): Promise<boolean> {
  // Poll document.readyState
}

chrome.action.onClicked.addListener(async (tab) => {
  // Validate tab
  // Wait for document ready
  // Capture screenshot
  // Inject CSS and scripts
  // Send initOverlay message
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "download") {
    // Handle download request
  }
  return true;
});
```

### src/utils/icons.ts

```typescript
export const icons = {
  select:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">...</svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">...</svg>',
  rect: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">...</svg>',
  ellipse:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">...</svg>',
  text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">...</svg>',
  undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">...</svg>',
  clear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">...</svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">...</svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">...</svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">...</svg>',
} as const;

export type IconName = keyof typeof icons;
```

### src/utils/toast.ts

```typescript
import { getState } from "../content/state";

export function showToast(
  message: string,
  type: "success" | "error" = "success"
): void {
  const state = getState();
  const existing = document.querySelector(".bf-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className =
    "bf-toast fixed bottom-25 left-1/2 transform -translate-x-1/2 ...";
  toast.textContent = message;

  if (type === "error") {
    toast.className = toast.className.replace("bg-bf-primary", "bg-red-500");
  } else if (type === "success") {
    toast.className = toast.className.replace("bg-bf-primary", "bg-green-500");
  }

  state.overlay?.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
```

### src/utils/storage.ts

```typescript
export async function getAuthToken(): Promise<string | null> {
  const result = await chrome.storage.local.get("authToken");
  return result.authToken || null;
}

export async function setAuthToken(token: string): Promise<void> {
  await chrome.storage.local.set({ authToken: token });
}

export async function clearAuthToken(): Promise<void> {
  await chrome.storage.local.remove("authToken");
}
```

## Data Models

### Task (saved annotation)

```typescript
interface Task {
  id: string; // Unique identifier (timestamp + random)
  createdAt: string; // ISO timestamp
  pageUrl: string; // URL where annotation was created
  pageTitle: string; // Page title
  title: string; // User-provided title
  type: string; // bug | improvement | question
  priority: string; // urgent | high | medium | low
  description: string; // User-provided description
  screenshotOriginal: string; // Base64 data URL
  screenshotAnnotated: string; // Base64 data URL with annotations
  canvasData: object; // Fabric.js JSON for re-editing
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Keyboard shortcut mapping consistency

_For any_ valid keyboard shortcut key (s, a, r, e, t), pressing that key SHALL trigger the corresponding tool selection, and the mapping SHALL be consistent across all invocations.

**Validates: Requirements 8.5**

### Property 2: State cleanup completeness

_For any_ overlay session, calling cleanupOverlay SHALL reset all state properties to their initial values and remove all DOM elements, leaving no residual state.

**Validates: Requirements 8.4**

### Property 3: Tool selection state consistency

_For any_ tool selection, the state.currentTool SHALL match the selected tool, and exactly one toolbar button SHALL have the 'active' class.

**Validates: Requirements 8.2**

## Error Handling

1. **Build Errors**: TypeScript compiler reports type errors with file/line information
2. **Runtime Errors**: Try-catch around Fabric.js operations with console warnings
3. **Tab Validation**: Background script validates tabs before capture attempts
4. **Download Failures**: Toast notification on save failure with error message

## Testing Strategy

### Unit Tests

Unit tests verify specific examples and edge cases:

- State initialization returns correct default values
- Keyboard handler ignores events when in text input
- Tool selection updates state correctly
- Cleanup removes all DOM elements

### Property-Based Tests

Property-based tests verify universal properties across all inputs using a PBT library (e.g., fast-check):

- **Property 1**: Test all shortcut keys map to correct tools
- **Property 2**: Test cleanup leaves no residual state
- **Property 3**: Test tool selection maintains UI consistency

Configuration:

- Minimum 100 iterations per property test
- Tag format: **Feature: extension-refactor, Property {number}: {property_text}**

### Integration Tests

Manual testing in Chrome:

- Extension loads without errors
- Screenshot capture works on various pages
- All drawing tools create correct shapes
- Save downloads both JSON and PNG
- Cancel closes overlay cleanly
