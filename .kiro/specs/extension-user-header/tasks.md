# Implementation Plan: Extension User Header

## Overview

This implementation adds a header to the annotation form with user avatar and logout functionality, while improving authentication security. Tasks are ordered to build incrementally with testing at each step.

## Tasks

- [x] 1. Update User type to include avatarUrl

  - Modify `apps/extension/src/utils/auth-storage.ts` to add optional `avatarUrl` field to User interface
  - _Requirements: 2.2_

- [x] 2. Create initials derivation utility

  - [x] 2.1 Implement getInitials function in `apps/extension/src/utils/user-utils.ts`
    - Return first character of name (uppercased) if name exists
    - Return first character of email (uppercased) if name is null/empty
    - _Requirements: 2.3, 2.4_
  - [ ]\* 2.2 Write property test for initials derivation
    - **Property 3: Initials Derivation**
    - **Validates: Requirements 2.3, 2.4**

- [x] 3. Enhance auth listener security

  - [x] 3.1 Update `apps/extension/src/content/auth-listener.ts` with strict origin validation
    - Define ALLOWED_ORIGINS constant array
    - Add isAllowedOrigin helper function
    - Update handleAuthMessage to validate origin before processing
    - _Requirements: 1.1, 1.3_
  - [ ]\* 3.2 Write property test for origin validation
    - **Property 1: Origin Validation**
    - **Validates: Requirements 1.1, 1.3**

- [x] 4. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create user avatar component

  - [x] 5.1 Create `apps/extension/src/content/user-avatar.ts`
    - Implement createUserAvatar function that renders image or initials
    - Implement createAvatarDropdown function with email and sign out option
    - Add handleAvatarClick to toggle dropdown visibility
    - Add handleLogout to clear auth state and close overlay
    - Add click-outside and Escape key handlers to close dropdown
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 5.1, 5.2, 5.3, 5.4, 5.5_
  - [ ]\* 5.2 Write property test for avatar rendering
    - **Property 4: Avatar Rendering**
    - **Validates: Requirements 2.2, 2.3**

- [x] 6. Create form header component

  - [x] 6.1 Create `apps/extension/src/content/form-header.ts`
    - Implement createFormHeader function with workspace selector and avatar
    - Implement initFormHeader to set up event listeners
    - Implement cleanupFormHeader for cleanup
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Update overlay to use form header

  - [x] 7.1 Modify `apps/extension/src/content/overlay.ts`
    - Import and use createFormHeader in the form panel
    - Remove workspace row from form body (move to header)
    - Call initFormHeader after overlay creation
    - Call cleanupFormHeader in cleanupOverlay
    - _Requirements: 4.5_

- [x] 8. Implement logout functionality

  - [x] 8.1 Update user-avatar.ts handleLogout function
    - Call clearAuthState from auth-storage
    - Call cleanupOverlay to close the annotation form
    - _Requirements: 3.2, 3.3_
  - [ ]\* 8.2 Write property test for logout clears auth state
    - **Property 5: Logout Clears Auth State**
    - **Validates: Requirements 3.2**

- [x] 9. Add CSS styles for header components

  - Update `apps/extension/src/styles/input.css` with styles for:
    - Form header layout (flex, border-bottom)
    - User avatar (circle, image/initials)
    - Avatar dropdown (positioned, shadow, hover states)
    - _Requirements: 4.1, 4.4_

- [x] 10. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ]\* 11. Write integration tests

  - [ ]\* 11.1 Test auth flow from postMessage to storage to UI
    - **Validates: Requirements 1.2**
  - [ ]\* 11.2 Test logout flow clears storage and closes overlay
    - **Validates: Requirements 3.2, 3.3, 3.4**

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The implementation uses TypeScript throughout for type safety
- Property tests use fast-check library for randomized input generation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation of functionality
