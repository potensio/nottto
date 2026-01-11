# Design Document

## Overview

This design describes the implementation of workspace and project selection in the Chrome extension's annotation form, along with project creation capabilities in both the extension and the Next.js dashboard. The solution integrates with the existing API infrastructure and maintains consistency with the current UI patterns.

## Architecture

The feature follows the existing architecture patterns:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Chrome Extension                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   Overlay   │───▶│    Form     │───▶│  Workspace/Project  │ │
│  │  (overlay.ts)│    │  (form.ts)  │    │   Selectors (new)   │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│                            │                      │              │
│                            ▼                      ▼              │
│                     ┌─────────────┐    ┌─────────────────────┐ │
│                     │   Actions   │    │   Storage Utils     │ │
│                     │ (actions.ts)│    │ (storage.ts - new)  │ │
│                     └─────────────┘    └─────────────────────┘ │
│                            │                      │              │
│                            ▼                      ▼              │
│                     ┌─────────────────────────────────────────┐ │
│                     │           API Client Layer              │ │
│                     │  (workspaces.ts, projects.ts)           │ │
│                     └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend API                               │
│  /workspaces, /workspaces/:id/projects, /projects/:id/annotations│
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Dashboard                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Workspace Page - Project List with Create Project Modal    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Extension Components

#### 1. Workspace Selector Component

Location: `apps/extension/src/content/workspace-selector.ts`

```typescript
interface WorkspaceSelectorState {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  isLoading: boolean;
  error: string | null;
}

// Functions
function createWorkspaceSelector(): HTMLElement;
function loadWorkspaces(): Promise<void>;
function handleWorkspaceChange(workspaceId: string): void;
function renderWorkspaceDropdown(workspaces: Workspace[]): void;
function renderNoWorkspacesMessage(): void;
function renderError(message: string): void;
```

#### 2. Project Selector Component

Location: `apps/extension/src/content/project-selector.ts`

```typescript
interface ProjectSelectorState {
  projects: Project[];
  selectedProjectId: string | null;
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
  newProjectName: string;
}

// Functions
function createProjectSelector(workspaceId: string): HTMLElement;
function loadProjects(workspaceId: string): Promise<void>;
function handleProjectChange(projectId: string): void;
function handleCreateProject(name: string): Promise<void>;
function renderProjectDropdown(projects: Project[]): void;
function renderCreateProjectForm(): void;
function renderError(message: string): void;
```

#### 3. Selection Storage

Location: `apps/extension/src/utils/selection-storage.ts`

```typescript
interface SelectionData {
  workspaceId: string | null;
  projectId: string | null;
}

// Functions
function saveSelection(data: SelectionData): Promise<void>;
function loadSelection(): Promise<SelectionData>;
function clearSelection(): Promise<void>;
```

#### 4. Updated Form Integration

Location: `apps/extension/src/content/form.ts` (modified)

```typescript
interface FormData {
  title: string;
  type: string;
  priority: string;
  description: string;
  workspaceId: string; // New field
  projectId: string; // New field
}

function getFormData(): FormData;
function validateForm(): { valid: boolean; errors: string[] };
```

### Dashboard Components

#### 1. Create Project Modal

Location: `apps/web/src/components/dashboard/CreateProjectModal.tsx`

```typescript
interface CreateProjectModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

function CreateProjectModal(props: CreateProjectModalProps): JSX.Element;
```

#### 2. Updated Workspace Page

Location: `apps/web/src/app/dashboard/[workspaceSlug]/page.tsx` (modified)

Add "Create Project" button that opens the CreateProjectModal.

## Data Models

### Existing Models (No Changes)

```typescript
// From apps/extension/src/api/workspaces.ts
interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

// From apps/extension/src/api/projects.ts
interface Project {
  id: string;
  name: string;
  slug: string;
  workspaceId: string;
  description?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
}
```

### New Models

```typescript
// Selection persistence
interface SelectionData {
  workspaceId: string | null;
  projectId: string | null;
  timestamp: number; // For cache invalidation
}
```

## UI Design

### Extension Annotation Form Updates

The form will be updated to include workspace and project selectors above the existing fields:

```
┌─────────────────────────────────────────┐
│  Write an annotation title              │
├─────────────────────────────────────────┤
│  📁 Workspace    [Dropdown ▼]           │
├─────────────────────────────────────────┤
│  📂 Project      [Dropdown ▼] [+ New]   │
├─────────────────────────────────────────┤
│  👤 Reported by  You                    │
├─────────────────────────────────────────┤
│  🏷️ Type         [Dropdown ▼]           │
├─────────────────────────────────────────┤
│  ⏰ Priority     [Dropdown ▼]           │
├─────────────────────────────────────────┤
│  Description                            │
│  ┌─────────────────────────────────────┐│
│  │ What is this annotation about?      ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│  [Cancel]                    [Save]     │
└─────────────────────────────────────────┘
```

### Project Creation Inline Form (Extension)

When user clicks "+ New" for project:

```
┌─────────────────────────────────────────┐
│  📂 Project                             │
│  ┌─────────────────────────────────────┐│
│  │ Enter project name...               ││
│  └─────────────────────────────────────┘│
│  [Cancel] [Create]                      │
└─────────────────────────────────────────┘
```

### Dashboard Create Project Modal

```
┌─────────────────────────────────────────┐
│  Create New Project              [×]    │
├─────────────────────────────────────────┤
│  Project Name                           │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  Description (optional)                 │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│                    [Cancel] [Create]    │
└─────────────────────────────────────────┘
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Workspace List Rendering

_For any_ list of workspaces returned by the API, the workspace dropdown should contain exactly those workspaces with their correct names and IDs.

**Validates: Requirements 1.1, 1.2**

### Property 2: Workspace Selection State Management

_For any_ workspace selection event, the selected workspace ID should be stored in the component state and the project selector should become enabled.

**Validates: Requirements 1.3**

### Property 3: Project List Rendering

_For any_ workspace ID and list of projects returned by the API for that workspace, the project dropdown should contain exactly those projects with their correct names and IDs.

**Validates: Requirements 3.1, 3.2**

### Property 4: Project Selection State Management

_For any_ project selection event, the selected project ID should be stored in the component state and available for form submission.

**Validates: Requirements 3.3**

### Property 5: Project Creation with Valid Name

_For any_ non-empty, non-whitespace project name submitted for creation, the API should be called with that name and the correct workspace ID.

**Validates: Requirements 4.3, 5.3**

### Property 6: Project Name Validation

_For any_ string composed entirely of whitespace (including empty string), attempting to create a project should be rejected without calling the API.

**Validates: Requirements 4.6, 5.6**

### Property 7: Annotation Submission Includes Project ID

_For any_ annotation submission where a project is selected, the API request payload should include the selected project ID.

**Validates: Requirements 6.1**

### Property 8: Annotation Submission Blocked Without Project

_For any_ annotation submission attempt where no project is selected, the submission should be prevented and a validation error should be displayed.

**Validates: Requirements 6.2**

### Property 9: Selection Persistence Round-Trip

_For any_ workspace and project selection, saving the selection to storage and then loading it should return the same workspace ID and project ID.

**Validates: Requirements 7.1, 7.2**

### Property 10: Selection Restoration

_For any_ persisted selection where both the workspace and project still exist in the API response, loading the form should restore those selections.

**Validates: Requirements 7.3**

## Error Handling

### Extension Error Handling

| Error Scenario              | User Feedback                                           | Recovery Action                 |
| --------------------------- | ------------------------------------------------------- | ------------------------------- |
| Workspace fetch fails       | "Failed to load workspaces. Please try again."          | Retry button                    |
| Project fetch fails         | "Failed to load projects. Please try again."            | Retry button                    |
| Project creation fails      | "Failed to create project. Please try again."           | Preserve input, allow retry     |
| Annotation submission fails | "Failed to save annotation. Please try again."          | Preserve form data, allow retry |
| Network timeout             | "Connection timed out. Check your internet connection." | Retry button                    |
| Authentication expired      | "Session expired. Please sign in again."                | Redirect to auth flow           |

### Dashboard Error Handling

| Error Scenario         | User Feedback                     | Recovery Action               |
| ---------------------- | --------------------------------- | ----------------------------- |
| Project creation fails | Toast: "Failed to create project" | Modal stays open, allow retry |
| Validation error       | Inline error message under input  | User corrects input           |

### Validation Rules

**Project Name Validation:**

- Must not be empty
- Must not be only whitespace
- Maximum length: 100 characters
- Allowed characters: alphanumeric, spaces, hyphens, underscores

## Testing Strategy

### Unit Tests

Unit tests will cover specific examples and edge cases:

1. **Workspace Selector**

   - Renders loading state while fetching
   - Renders empty state message when no workspaces
   - Renders error state with retry button on fetch failure
   - Correctly populates dropdown with workspace data

2. **Project Selector**

   - Renders disabled state when no workspace selected
   - Renders loading state while fetching
   - Renders create option when no projects exist
   - Correctly populates dropdown with project data

3. **Project Creation Form**

   - Shows validation error for empty name
   - Shows validation error for whitespace-only name
   - Calls API with correct data on valid submission
   - Shows error message on API failure

4. **Selection Storage**

   - Saves selection to chrome.storage.local
   - Loads selection from chrome.storage.local
   - Clears selection correctly

5. **Form Validation**
   - Prevents submission without project selected
   - Includes project ID in submission data

### Property-Based Tests

Property-based tests will use fast-check library for TypeScript to verify universal properties:

**Configuration:**

- Minimum 100 iterations per property test
- Each test tagged with: **Feature: extension-workspace-project-selection, Property N: [property_text]**

**Test Files:**

- `apps/extension/src/__tests__/workspace-selector.property.test.ts`
- `apps/extension/src/__tests__/project-selector.property.test.ts`
- `apps/extension/src/__tests__/selection-storage.property.test.ts`
- `apps/extension/src/__tests__/form-validation.property.test.ts`
- `apps/web/src/__tests__/create-project.property.test.ts`

**Property Test Implementation:**

```typescript
// Example: Property 9 - Selection Persistence Round-Trip
import * as fc from "fast-check";

describe("Selection Storage", () => {
  it("Property 9: round-trip persistence", () => {
    fc.assert(
      fc.property(
        fc.record({
          workspaceId: fc.string({ minLength: 1 }),
          projectId: fc.string({ minLength: 1 }),
        }),
        async (selection) => {
          await saveSelection(selection);
          const loaded = await loadSelection();
          return (
            loaded.workspaceId === selection.workspaceId &&
            loaded.projectId === selection.projectId
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Tests

Integration tests will verify end-to-end flows:

1. **Extension Flow**

   - Load form → Select workspace → Select project → Submit annotation
   - Load form → Select workspace → Create project → Submit annotation
   - Load form with persisted selection → Verify restoration

2. **Dashboard Flow**
   - Open workspace → Click create project → Submit → Verify in list
