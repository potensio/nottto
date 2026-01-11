# Implementation Plan: Dashboard UI

## Overview

This plan implements the Nottto Dashboard UI using Next.js App Router with TypeScript. Tasks are organized to build incrementally: foundation first (routing, layout, auth), then core components, then pages, and finally polish (loading states, error handling).

## Tasks

- [x] 1. Set up dashboard routing and layout foundation

  - [x] 1.1 Create dashboard route structure

    - Create `/dashboard/page.tsx` (workspace selector/redirect)
    - Create `/dashboard/[workspaceSlug]/page.tsx` (workspace dashboard)
    - Create `/dashboard/[workspaceSlug]/projects/[projectSlug]/page.tsx` (project detail)
    - Create `/dashboard/[workspaceSlug]/annotations/[id]/page.tsx` (annotation detail)
    - _Requirements: 7.1_

  - [x] 1.2 Create DashboardLayout component

    - Implement header + sidebar + main content structure
    - Add responsive behavior (sidebar visible ≥1024px, collapsed <1024px)
    - Include animated background elements consistent with landing page
    - _Requirements: 6.1, 6.2, 9.4_

  - [x] 1.3 Create DashboardHeader component

    - Add logo, workspace selector dropdown, user menu
    - Implement workspace switching navigation
    - Style with established design system (neutral colors, Manrope font)
    - _Requirements: 1.1, 1.2, 1.3, 9.1, 9.2_

  - [x] 1.4 Create Sidebar component
    - Display projects list with annotation counts
    - Highlight current project
    - Add collapse/expand toggle for mobile
    - _Requirements: 2.3, 4.1, 6.2_

- [x] 2. Implement data layer and API integration

  - [x] 2.1 Create API client with auth

    - Create fetch wrapper with JWT token handling
    - Implement token refresh logic
    - Add error handling for 401/403/404/500 responses
    - _Requirements: 8.2, 8.3_

  - [x] 2.2 Create React Query hooks

    - `useWorkspaces()` - fetch user's workspaces
    - `useProjects(workspaceId)` - fetch workspace projects with annotation counts
    - `useAnnotations(projectId)` - fetch project annotations
    - `useAnnotation(id)` - fetch single annotation detail
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.3 Create Auth context and provider
    - Store user, tokens in context
    - Implement login/logout functions
    - Add auth redirect middleware for protected routes
    - _Requirements: 8.3_

- [x] 3. Implement core UI components

  - [x] 3.1 Create AnnotationCard component

    - Display thumbnail (or placeholder if missing)
    - Show title, priority badge, project name
    - Show truncated page URL and formatted creation date
    - Make entire card clickable
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]\* 3.2 Write property test for AnnotationCard data completeness

    - **Property 5: Annotation card data completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ]\* 3.3 Write property test for URL truncation

    - **Property 6: URL truncation**
    - **Validates: Requirements 3.3**

  - [x] 3.4 Create AnnotationGrid component

    - Responsive grid layout (1 col mobile, 2 col tablet, 3+ col desktop)
    - Map annotations to AnnotationCard components
    - Handle click navigation to detail view
    - _Requirements: 6.3_

  - [ ]\* 3.5 Write property test for responsive grid columns

    - **Property 9: Responsive grid columns**
    - **Validates: Requirements 6.3**

  - [x] 3.6 Create StatsBar component

    - Display total annotations, this week count, high priority count
    - Style with Instrument Serif for numbers
    - _Requirements: 2.1, 9.2_

  - [x] 3.7 Create EmptyState component
    - Variants: no-workspaces, no-projects, no-annotations
    - Include appropriate icons and action buttons
    - Guide users to install extension when no annotations
    - _Requirements: 1.4, 2.4, 4.4_

- [x] 4. Checkpoint - Ensure components render correctly

  - Ensure all component tests pass, ask the user if questions arise.

- [x] 5. Implement dashboard pages

  - [x] 5.1 Implement workspace selector page (`/dashboard`)

    - Show workspace list if multiple workspaces
    - Auto-redirect if single workspace
    - Show empty state if no workspaces
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ]\* 5.2 Write property test for workspace selector visibility

    - **Property 1: Workspace selector visibility**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 5.3 Implement workspace dashboard page

    - Fetch and display stats bar
    - Fetch and display recent annotations (sorted newest first)
    - Show empty state if no annotations
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ]\* 5.4 Write property test for annotation list ordering

    - **Property 3: Annotation list ordering**
    - **Validates: Requirements 2.2**

  - [x] 5.5 Implement project detail page

    - Display breadcrumb navigation
    - Fetch and display project's annotations
    - Show project-specific empty state if no annotations
    - _Requirements: 4.2, 4.3, 4.4_

  - [x] 5.6 Implement annotation detail page

    - Display full annotated screenshot
    - Display all metadata fields
    - Add copy shareable link button
    - Add back/breadcrumb navigation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]\* 5.7 Write property test for annotation detail metadata completeness
    - **Property 7: Annotation detail metadata completeness**
    - **Validates: Requirements 5.2**

- [x] 6. Checkpoint - Ensure pages work end-to-end

  - Ensure all page tests pass, ask the user if questions arise.

- [x] 7. Implement loading and error states

  - [x] 7.1 Create skeleton components

    - AnnotationCardSkeleton with pulse animation
    - SidebarSkeleton for projects list
    - StatsBarSkeleton for stats
    - _Requirements: 3.5, 8.1_

  - [x] 7.2 Create error boundary and error UI

    - Network error with retry button
    - 404 page with navigation back
    - Generic error state with retry
    - _Requirements: 8.2, 8.4_

  - [x] 7.3 Implement auth redirect
    - Redirect unauthenticated users to /auth
    - Preserve return URL for post-login redirect
    - _Requirements: 8.3_

- [x] 8. Final polish and responsive testing

  - [x] 8.1 Verify responsive breakpoints

    - Test sidebar collapse at 1024px breakpoint
    - Test grid column changes at breakpoints
    - Verify touch targets on mobile (44px minimum)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]\* 8.2 Write property test for responsive sidebar breakpoint

    - **Property 8: Responsive sidebar breakpoint**
    - **Validates: Requirements 6.1, 6.2**

  - [x] 8.3 Apply visual design consistency
    - Verify color palette usage throughout
    - Verify typography (Instrument Serif headings, Manrope body)
    - Add glass panel effects where appropriate
    - Ensure Iconify/lucide icons used consistently
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [x] 9. Final checkpoint - Full integration test
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use fast-check library with minimum 100 iterations
- Unit tests use Vitest + React Testing Library
