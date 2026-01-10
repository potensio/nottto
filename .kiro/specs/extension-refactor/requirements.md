# Requirements Document

## Introduction

Refactor the BugFinder Chrome extension from a flat file structure to a modular TypeScript architecture. This prepares the codebase for monorepo integration and future features (auth, API integration, workspace management).

## Glossary

- **Extension**: The BugFinder Chrome extension for screenshot annotation
- **Content_Script**: JavaScript that runs in the context of web pages
- **Background_Script**: Service worker that handles extension events
- **Overlay**: The full-screen annotation UI injected into pages
- **Fabric_Canvas**: The Fabric.js canvas used for drawing annotations
- **State_Manager**: Module responsible for centralized state management
- **Build_System**: esbuild-based compilation pipeline for TypeScript

## Requirements

### Requirement 1: TypeScript Build System

**User Story:** As a developer, I want a TypeScript build system with esbuild, so that I can write type-safe code with fast compilation.

#### Acceptance Criteria

1. THE Build_System SHALL compile TypeScript files from `src/` to `dist/`
2. THE Build_System SHALL bundle content script to `dist/content.js`
3. THE Build_System SHALL bundle background script to `dist/background.js`
4. THE Build_System SHALL support watch mode for development
5. THE Build_System SHALL target Chrome 100+ compatibility
6. WHEN TypeScript compilation fails, THE Build_System SHALL report clear error messages

### Requirement 2: Modular Content Script Architecture

**User Story:** As a developer, I want the content script split into focused modules, so that the code is maintainable and testable.

#### Acceptance Criteria

1. THE State_Manager SHALL centralize all window-level state in `src/content/state.ts`
2. THE Extension SHALL separate overlay DOM creation into `src/content/overlay.ts`
3. THE Extension SHALL separate Fabric.js canvas logic into `src/content/canvas.ts`
4. THE Extension SHALL separate drawing tools into `src/content/tools.ts`
5. THE Extension SHALL separate form handling into `src/content/form.ts`
6. THE Extension SHALL separate user actions into `src/content/actions.ts`
7. THE Extension SHALL separate keyboard shortcuts into `src/content/keyboard.ts`
8. THE Extension SHALL have an entry point at `src/content/index.ts` that orchestrates all modules

### Requirement 3: Background Script Refactor

**User Story:** As a developer, I want the background script converted to TypeScript, so that it benefits from type safety.

#### Acceptance Criteria

1. THE Background_Script SHALL be located at `src/background/index.ts`
2. THE Background_Script SHALL handle extension icon clicks
3. THE Background_Script SHALL capture screenshots and inject content scripts
4. THE Background_Script SHALL handle download requests from content script

### Requirement 4: Utility Modules

**User Story:** As a developer, I want shared utilities extracted into reusable modules, so that code duplication is minimized.

#### Acceptance Criteria

1. THE Extension SHALL extract SVG icons into `src/utils/icons.ts`
2. THE Extension SHALL extract toast notifications into `src/utils/toast.ts`
3. THE Extension SHALL provide Chrome storage helpers in `src/utils/storage.ts`

### Requirement 5: Type Definitions

**User Story:** As a developer, I want TypeScript interfaces for all data structures, so that the codebase is self-documenting and type-safe.

#### Acceptance Criteria

1. THE Extension SHALL define `BugfinderState` interface in `src/types/index.ts`
2. THE Extension SHALL define `Task` interface for saved annotations
3. THE Extension SHALL define `Tool` type for available drawing tools

### Requirement 6: API Layer Preparation

**User Story:** As a developer, I want API client stubs prepared, so that backend integration is straightforward in the future.

#### Acceptance Criteria

1. THE Extension SHALL provide a base API client in `src/api/client.ts`
2. THE Extension SHALL provide auth API stubs in `src/api/auth.ts`
3. THE Extension SHALL provide workspace API stubs in `src/api/workspaces.ts`
4. THE Extension SHALL provide project API stubs in `src/api/projects.ts`
5. THE Extension SHALL provide annotation API stubs in `src/api/annotations.ts`

### Requirement 7: Manifest and Configuration Updates

**User Story:** As a developer, I want the manifest and configs updated for the new structure, so that the extension loads correctly from `dist/`.

#### Acceptance Criteria

1. THE Extension SHALL update `manifest.json` to reference `dist/` paths
2. THE Extension SHALL update `tailwind.config.js` for new source paths
3. THE Extension SHALL move CSS source to `src/styles/input.css`
4. THE Extension SHALL output CSS to `dist/overlay.css`

### Requirement 8: Functional Parity

**User Story:** As a user, I want all existing features to work after the refactor, so that my workflow is not disrupted.

#### Acceptance Criteria

1. WHEN the extension icon is clicked, THE Extension SHALL capture and display the screenshot overlay
2. WHEN drawing tools are used, THE Extension SHALL create annotations on the canvas
3. WHEN the save button is clicked, THE Extension SHALL download the annotated screenshot and JSON
4. WHEN the cancel button is clicked, THE Extension SHALL close the overlay and restore the page
5. WHEN keyboard shortcuts are pressed, THE Extension SHALL respond with the appropriate action
