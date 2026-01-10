# Nottto Extension Refactor Plan

## Overview

Refactor the Chrome extension from a flat file structure to a modular architecture, preparing it for monorepo integration and future features (auth, API integration, workspace management).

## Current Structure

```
nottto/
├── manifest.json
├── background.js           # 70 lines
├── content.js              # 650+ lines (everything in one file)
├── overlay.css             # Generated Tailwind
├── src/input.css           # Tailwind source
├── lib/fabric.min.js
├── icons/
├── tailwind.config.js
├── package.json
└── build.sh
```

## Target Structure

```
nottto/                    # Will become apps/extension/ in monorepo
├── manifest.json
├── dist/                     # Built output (gitignored)
│   ├── content.js            # Bundled content script
│   ├── background.js         # Bundled background script
│   ├── popup.js              # Bundled popup script
│   └── overlay.css           # Built Tailwind CSS
├── popup.html                # Extension popup UI
├── src/
│   ├── background/
│   │   └── index.ts          # Background service worker
│   ├── content/
│   │   ├── index.ts          # Content script entry point
│   │   ├── state.ts          # Window-level state management
│   │   ├── overlay.ts        # Overlay UI creation & DOM
│   │   ├── canvas.ts         # Fabric.js canvas initialization
│   │   ├── tools.ts          # Drawing tools (arrow, rect, ellipse, text)
│   │   ├── form.ts           # Right panel form handling
│   │   ├── actions.ts        # Save, undo, delete, clear actions
│   │   └── keyboard.ts       # Keyboard shortcuts handler
│   ├── popup/
│   │   └── index.ts          # Popup script
│   ├── api/
│   │   ├── client.ts         # Base API client with auth headers
│   │   ├── auth.ts           # Auth API calls
│   │   ├── workspaces.ts     # Workspace API calls
│   │   ├── projects.ts       # Project API calls
│   │   └── annotations.ts    # Annotation API calls
│   ├── utils/
│   │   ├── storage.ts        # chrome.storage helpers
│   │   ├── icons.ts          # SVG icon strings
│   │   └── toast.ts          # Toast notification helper
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   └── styles/
│       └── input.css         # Tailwind source (move from src/)
├── lib/
│   └── fabric.min.js         # Keep as external lib
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── tailwind.config.js
├── tsconfig.json             # New: TypeScript config
├── esbuild.config.js         # New: Build config
├── package.json              # Updated with new scripts
└── README.md
```

## Module Breakdown

### src/content/index.ts

Entry point that orchestrates everything:

```typescript
// Imports all modules
// Registers chrome.runtime.onMessage listener
// Calls createOverlay() and initCanvas() on message
```

### src/content/state.ts

Centralized state management:

```typescript
export interface NotttoState {
  fabricCanvas: fabric.Canvas | null;
  overlay: HTMLElement | null;
  currentTool: string;
  isDrawing: boolean;
  // ... rest of state
}

export const state: NotttoState = { ... };
export function resetState(): void;
```

### src/content/overlay.ts

DOM creation for the overlay:

```typescript
export function createOverlay(): void;
export function cleanupOverlay(): void;
```

### src/content/canvas.ts

Fabric.js canvas setup:

```typescript
export function initCanvas(dataUrl: string): void;
export function getCanvas(): fabric.Canvas;
```

### src/content/tools.ts

Drawing tool implementations:

```typescript
export function selectTool(tool: string): void;
export function onMouseDown(event: fabric.IEvent): void;
export function onMouseMove(event: fabric.IEvent): void;
export function onMouseUp(event: fabric.IEvent): void;
export function addText(x: number, y: number, color: string): void;
```

### src/content/form.ts

Right panel form handling:

```typescript
export function getFormData(): FormData;
export function setupFormListeners(): void;
```

### src/content/actions.ts

User actions:

```typescript
export function saveAnnotation(): Promise<void>;
export function undo(): void;
export function deleteSelected(): void;
export function clearAnnotations(): void;
```

### src/content/keyboard.ts

Keyboard shortcuts:

```typescript
export function setupKeyboardHandler(): void;
export function removeKeyboardHandler(): void;
```

### src/api/client.ts

Base API client:

```typescript
const API_BASE = "https://api.nottto.com";

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T>;

export function setAuthToken(token: string): void;
export function clearAuthToken(): void;
```

### src/utils/storage.ts

Chrome storage helpers:

```typescript
export async function getAuthToken(): Promise<string | null>;
export async function setAuthToken(token: string): Promise<void>;
export async function clearAuthToken(): Promise<void>;
export async function getCurrentProject(): Promise<Project | null>;
export async function setCurrentProject(project: Project): Promise<void>;
```

### src/utils/icons.ts

SVG icons (extracted from content.js):

```typescript
export const icons = {
  select: "<svg>...</svg>",
  arrow: "<svg>...</svg>",
  // ...
};
```

### src/types/index.ts

Shared TypeScript types:

```typescript
export interface User { ... }
export interface Workspace { ... }
export interface Project { ... }
export interface Annotation { ... }
export interface NotttoState { ... }
```

## Build Setup

### esbuild.config.js

```javascript
const esbuild = require("esbuild");

// Content script bundle
esbuild.build({
  entryPoints: ["src/content/index.ts"],
  bundle: true,
  outfile: "dist/content.js",
  format: "iife",
  target: "chrome100",
});

// Background script bundle
esbuild.build({
  entryPoints: ["src/background/index.ts"],
  bundle: true,
  outfile: "dist/background.js",
  format: "iife",
  target: "chrome100",
});

// Popup script bundle
esbuild.build({
  entryPoints: ["src/popup/index.ts"],
  bundle: true,
  outfile: "dist/popup.js",
  format: "iife",
  target: "chrome100",
});
```

### package.json scripts

```json
{
  "scripts": {
    "build": "npm run build:js && npm run build:css",
    "build:js": "node esbuild.config.js",
    "build:css": "tailwindcss -i src/styles/input.css -o dist/overlay.css --minify",
    "dev": "npm run build:js -- --watch & npm run build:css -- --watch",
    "typecheck": "tsc --noEmit"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": false,
    "types": ["chrome"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Updated manifest.json

```json
{
  "manifest_version": 3,
  "name": "Nottto - Screenshot Annotator",
  "version": "2.1.0",
  "description": "Capture screenshots and annotate with arrows, boxes, and text",
  "permissions": ["activeTab", "downloads", "scripting", "storage"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "dist/background.js"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "web_accessible_resources": [
    {
      "resources": ["dist/overlay.css"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

## Migration Steps

### Phase 1: Setup Build Tooling

1. [ ] Install dependencies: `typescript`, `esbuild`, `@types/chrome`
2. [ ] Create `tsconfig.json`
3. [ ] Create `esbuild.config.js`
4. [ ] Update `package.json` scripts
5. [ ] Add `dist/` to `.gitignore`
6. [ ] Move `src/input.css` to `src/styles/input.css`
7. [ ] Update Tailwind config for new paths

### Phase 2: Create Module Structure

1. [ ] Create folder structure under `src/`
2. [ ] Create `src/types/index.ts` with interfaces
3. [ ] Create `src/utils/icons.ts` (extract from content.js)
4. [ ] Create `src/utils/toast.ts` (extract from content.js)
5. [ ] Create `src/utils/storage.ts` (new)

### Phase 3: Refactor Content Script

1. [ ] Create `src/content/state.ts`
2. [ ] Create `src/content/overlay.ts`
3. [ ] Create `src/content/canvas.ts`
4. [ ] Create `src/content/tools.ts`
5. [ ] Create `src/content/form.ts`
6. [ ] Create `src/content/actions.ts`
7. [ ] Create `src/content/keyboard.ts`
8. [ ] Create `src/content/index.ts` (wire everything together)
9. [ ] Delete old `content.js`

### Phase 4: Refactor Background Script

1. [ ] Create `src/background/index.ts`
2. [ ] Delete old `background.js`

### Phase 5: Add Popup

1. [ ] Create `popup.html`
2. [ ] Create `src/popup/index.ts`

### Phase 6: Add API Layer (Prep for Backend)

1. [ ] Create `src/api/client.ts`
2. [ ] Create `src/api/auth.ts`
3. [ ] Create `src/api/workspaces.ts`
4. [ ] Create `src/api/projects.ts`
5. [ ] Create `src/api/annotations.ts`

### Phase 7: Update Manifest & Test

1. [ ] Update `manifest.json` for new paths
2. [ ] Build extension: `npm run build`
3. [ ] Load unpacked in Chrome
4. [ ] Test all functionality works

### Phase 8: Cleanup

1. [ ] Remove old files (`content.js`, `background.js`, `overlay.css`)
2. [ ] Update README.md
3. [ ] Update `build.sh` or remove if not needed

## Monorepo Preparation

After refactor, the extension folder is ready to move:

```bash
# From nottto root
mkdir -p apps
mv . apps/extension  # Move everything
# Then set up monorepo root with pnpm-workspace.yaml
```

The extension will work standalone or as part of monorepo — no code changes needed.

## New Dependencies

```json
{
  "devDependencies": {
    "typescript": "^5.x",
    "esbuild": "^0.20.x",
    "@types/chrome": "^0.x"
  }
}
```

## Notes

- Keep `lib/fabric.min.js` as external (don't bundle) — it's large and rarely changes
- TypeScript is optional but recommended for better DX and catching errors
- esbuild is fast and simple — no complex webpack config needed
- The `dist/` folder contains all built assets; manifest points there
- `src/api/` modules are stubs until backend is ready — they can return mock data initially
