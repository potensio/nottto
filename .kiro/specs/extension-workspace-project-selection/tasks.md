# Implementation Plan: Extension Workspace and Project Selection

## Overview

This implementation plan covers adding workspace and project selection to the Chrome extension's annotation form, along with project creation capabilities in both the extension and the Next.js dashboard. The implementation follows an incremental approach, building core functionality first and then adding persistence and validation.

## Tasks

- [x] 1. Create selection storage utility for the extension

  - [x] 1.1 Create `apps/extension/src/utils/selection-storage.ts` with save, load, and clear functions
    - Implement `saveSelection(data: SelectionData): Promise<void>`
    - Implement `loadSelection(): Promise<SelectionData>`
    - Implement `clearSelection(): Promise<void>`
    - Use `chrome.storage.local` for persistence
    - _Requirements: 7.1, 7.2_
  - [ ]\* 1.2 Write property test for selection persistence round-trip
    - **Property 9: Selection Persistence Round-Trip**
    - **Validates: Requirements 7.1, 7.2**

- [x] 2. Update overlay UI to include workspace and project selectors

  - [x] 2.1 Modify `apps/extension/src/content/overlay.ts` to add workspace and project selector HTML
    - Add workspace dropdown row after title input
    - Add project dropdown row with "+ New" button after workspace row
    - Add inline project creation form (hidden by default)
    - Use existing styling patterns (bf-select class)
    - _Requirements: 1.2, 3.2, 4.1_

- [x] 3. Implement workspace selector functionality

  - [x] 3.1 Create workspace selector logic in `apps/extension/src/content/workspace-selector.ts`
    - Implement `initWorkspaceSelector(): Promise<void>` to fetch and populate workspaces
    - Implement `handleWorkspaceChange(workspaceId: string): void` to update state and trigger project load
    - Handle loading, error, and empty states
    - _Requirements: 1.1, 1.3, 1.4, 1.5_
  - [ ]\* 3.2 Write property test for workspace list rendering
    - **Property 1: Workspace List Rendering**
    - **Validates: Requirements 1.1, 1.2**
  - [ ]\* 3.3 Write property test for workspace selection state management
    - **Property 2: Workspace Selection State Management**
    - **Validates: Requirements 1.3**

- [x] 4. Implement project selector functionality

  - [x] 4.1 Create project selector logic in `apps/extension/src/content/project-selector.ts`
    - Implement `initProjectSelector(workspaceId: string): Promise<void>` to fetch and populate projects
    - Implement `handleProjectChange(projectId: string): void` to update state
    - Handle loading, error, and empty states
    - _Requirements: 3.1, 3.3, 3.4, 3.5_
  - [ ]\* 4.2 Write property test for project list rendering
    - **Property 3: Project List Rendering**
    - **Validates: Requirements 3.1, 3.2**
  - [ ]\* 4.3 Write property test for project selection state management
    - **Property 4: Project Selection State Management**
    - **Validates: Requirements 3.3**

- [x] 5. Implement project creation in extension

  - [x] 5.1 Add project creation logic to `apps/extension/src/content/project-selector.ts`
    - Implement `showCreateProjectForm(): void` to display inline form
    - Implement `hideCreateProjectForm(): void` to hide form
    - Implement `handleCreateProject(name: string): Promise<void>` to create via API
    - Validate project name (non-empty, non-whitespace)
    - Auto-select newly created project
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_
  - [ ]\* 5.2 Write property test for project creation with valid name
    - **Property 5: Project Creation with Valid Name**
    - **Validates: Requirements 4.3, 5.3**
  - [ ]\* 5.3 Write property test for project name validation
    - **Property 6: Project Name Validation**
    - **Validates: Requirements 4.6, 5.6**

- [x] 6. Checkpoint - Ensure extension selector functionality works

  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Update form data and validation

  - [x] 7.1 Modify `apps/extension/src/content/form.ts` to include workspace and project in form data
    - Update `FormData` interface to include `workspaceId` and `projectId`
    - Update `getFormData()` to read selected workspace and project
    - Add `validateForm()` function to check required fields
    - _Requirements: 6.1, 6.2_
  - [ ]\* 7.2 Write property test for annotation submission includes project ID
    - **Property 7: Annotation Submission Includes Project ID**
    - **Validates: Requirements 6.1**
  - [ ]\* 7.3 Write property test for annotation submission blocked without project
    - **Property 8: Annotation Submission Blocked Without Project**
    - **Validates: Requirements 6.2**

- [x] 8. Update save action to use API

  - [x] 8.1 Modify `apps/extension/src/content/actions.ts` to submit annotation to API
    - Update `saveTask()` to call `createAnnotation()` API with project ID
    - Handle success and error responses
    - Show appropriate toast messages
    - _Requirements: 6.1, 6.3, 6.4_

- [x] 9. Implement selection persistence and restoration

  - [x] 9.1 Integrate selection storage with form initialization
    - Load saved selection when form opens
    - Validate saved selection against current workspaces/projects
    - Clear invalid selections
    - Save selection on workspace/project change
    - _Requirements: 7.3, 7.4_
  - [ ]\* 9.2 Write property test for selection restoration
    - **Property 10: Selection Restoration**
    - **Validates: Requirements 7.3**

- [x] 10. Checkpoint - Ensure extension functionality is complete

  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Create project creation modal for dashboard

  - [x] 11.1 Create `apps/web/src/components/dashboard/CreateProjectModal.tsx`
    - Implement modal with project name and optional description inputs
    - Add form validation (non-empty name)
    - Use `useCreateProject` hook for API call
    - Handle loading, success, and error states
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 12. Integrate create project modal into workspace page

  - [x] 12.1 Update `apps/web/src/app/dashboard/[workspaceSlug]/page.tsx`
    - Add "Create Project" button to page header
    - Add CreateProjectModal component with open/close state
    - Refresh project list on successful creation
    - _Requirements: 5.1, 5.4_

- [x] 13. Final checkpoint - Ensure all functionality works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The extension already has API client functions for workspaces and projects in place
