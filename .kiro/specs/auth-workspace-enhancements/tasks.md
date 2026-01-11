# Implementation Plan: Auth & Workspace Enhancements

## Overview

This implementation plan covers the enhancements to authentication flow (login vs register distinction) and workspace management (settings page, icon selection). Tasks are organized to build incrementally, with database changes first, then API updates, and finally frontend components.

## Tasks

- [x] 1. Update database schema for workspace icons and registration data

  - [x] 1.1 Add icon field to workspaces table in Drizzle schema
    - Add `icon` varchar field with default value "📁"
    - Update Workspace type exports
    - _Requirements: 4.1_
  - [x] 1.2 Add name and isRegister fields to magic_link_tokens table
    - Add `name` varchar field (nullable)
    - Add `isRegister` boolean field with default false
    - Update type exports
    - _Requirements: 1.5_
  - [x] 1.3 Create database migration for new fields
    - Generate migration with drizzle-kit
    - _Requirements: 4.1, 1.5_

- [x] 2. Update API magic link service for login/register distinction

  - [x] 2.1 Update magic link request endpoint to handle isRegister flag
    - Accept `isRegister` and `name` parameters
    - Check if email exists in database
    - Return 409 if registering with existing email
    - Return 404 if logging in with non-existent email
    - Store name and isRegister in magic link token
    - _Requirements: 1.5, 1.6, 1.7_
  - [ ]\* 2.2 Write property test for register with existing email returns 409
    - **Property 3: Register with Existing Email Returns Conflict**
    - **Validates: Requirements 1.6**
  - [ ]\* 2.3 Write property test for login with non-existent email returns 404
    - **Property 4: Login with Non-Existent Email Returns Not Found**
    - **Validates: Requirements 1.7**

- [x] 3. Update magic link verification to create Personal workspace

  - [x] 3.1 Update verify endpoint to create user with name from token
    - Extract name from magic link token for new users
    - Store name in users table
    - _Requirements: 1.5_
  - [x] 3.2 Create default "Personal" workspace for new users
    - Create workspace named "Personal" with slug "personal"
    - Assign default icon "📁"
    - Create default project within workspace
    - _Requirements: 2.1, 2.2, 2.4, 4.2_
  - [ ]\* 3.3 Write property test for registration creates user with Personal workspace
    - **Property 2: Registration Creates User with Personal Workspace**
    - **Validates: Requirements 1.5, 2.1, 2.2, 2.4**
  - [ ]\* 3.4 Write property test for new workspace has default icon
    - **Property 9: New Workspace Has Default Icon**
    - **Validates: Requirements 4.2**

- [x] 4. Checkpoint - Ensure API changes work correctly

  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update workspace API for icon support

  - [x] 5.1 Update workspace update endpoint to accept icon field
    - Add icon to UpdateWorkspaceInput validation
    - Store icon in database on update
    - _Requirements: 4.5_
  - [x] 5.2 Update workspace list/get endpoints to return icon field
    - Include icon in workspace response
    - _Requirements: 4.6_
  - [ ]\* 5.3 Write property test for workspace update round-trip
    - **Property 6: Workspace Update Round-Trip**
    - **Validates: Requirements 3.5, 3.6, 4.5**
  - [ ]\* 5.4 Write property test for duplicate slug returns conflict
    - **Property 7: Duplicate Slug Returns Conflict**
    - **Validates: Requirements 3.7**
  - [ ]\* 5.5 Write property test for settings access restricted to owners
    - **Property 8: Settings Access Restricted to Owners**
    - **Validates: Requirements 3.9**

- [x] 6. Update auth page with login/register toggle

  - [x] 6.1 Add mode state and toggle UI to auth page
    - Add login/register tabs or toggle
    - Show/hide name field based on mode
    - Preserve email when switching modes
    - _Requirements: 1.1, 1.2, 1.3, 1.8_
  - [x] 6.2 Add name input field for registration mode
    - Add full name input with validation
    - Validate name is not empty/whitespace on submit
    - _Requirements: 1.3, 1.4_
  - [x] 6.3 Update form submission to include isRegister and name
    - Pass isRegister flag to API
    - Pass name for registration
    - Handle 404/409 errors with appropriate messages
    - _Requirements: 1.5, 1.6, 1.7_
  - [ ]\* 6.4 Write property test for name validation rejects empty input
    - **Property 1: Name Validation Rejects Empty Input**
    - **Validates: Requirements 1.4**
  - [ ]\* 6.5 Write property test for mode switching preserves email
    - **Property 5: Mode Switching Preserves Email**
    - **Validates: Requirements 1.8**

- [x] 7. Checkpoint - Ensure auth page changes work correctly

  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create workspace settings page

  - [x] 8.1 Create settings page route and component
    - Create /dashboard/[workspaceSlug]/settings/page.tsx
    - Fetch workspace data on load
    - Display loading state
    - _Requirements: 3.1_
  - [x] 8.2 Implement settings form with name, slug, and icon fields
    - Add editable name input
    - Add editable slug input with validation
    - Add icon picker integration
    - _Requirements: 3.2, 3.3, 3.4_
  - [x] 8.3 Implement form submission and error handling
    - Call workspace update API on save
    - Display success message on save
    - Display error messages for conflicts
    - _Requirements: 3.5, 3.6, 3.7, 3.8_

- [x] 9. Create icon picker component

  - [x] 9.1 Create IconPicker component with curated emoji list
    - Display grid of available icons
    - Highlight selected icon
    - Call onSelect callback when icon clicked
    - _Requirements: 4.3, 4.7_
  - [x] 9.2 Add icon preview functionality
    - Show selected icon prominently
    - Update preview on selection
    - _Requirements: 4.4_

- [x] 10. Update dashboard sidebar to show workspace icons

  - [x] 10.1 Update workspace list in sidebar to display icons
    - Show workspace icon next to name
    - Use default icon if none set
    - _Requirements: 4.6, 4.8_
  - [x] 10.2 Add settings link to sidebar
    - Add settings icon/button for current workspace
    - Navigate to settings page on click
    - _Requirements: 5.1, 5.2_

- [x] 11. Add navigation between settings and dashboard

  - [x] 11.1 Add back button to settings page
    - Navigate back to workspace dashboard
    - _Requirements: 5.3_

- [x] 12. Update shared types and hooks

  - [x] 12.1 Update Workspace type in shared package
    - Add icon field to Workspace interface
    - Update CreateWorkspaceInput and UpdateWorkspaceInput
    - _Requirements: 4.1_
  - [x] 12.2 Update useWorkspaces hook to include icon
    - Update workspace type in hook
    - _Requirements: 4.6_

- [x] 13. Final checkpoint - Ensure all features work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Database migrations should be run before testing API changes
- Frontend changes depend on API changes being complete
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
