# Implementation Plan: Project Webhook Integration

## Overview

This implementation plan covers the UI components for project-level webhook integration. The approach is to build reusable components first, then compose them into the settings page, and finally add validation and testing.

## Tasks

- [x] 1. Create utility functions and types

  - [x] 1.1 Create TypeScript interfaces for webhook integration data
    - Define `WebhookIntegration`, `WebhookIntegrationInput`, `HeaderEntry`, `TestResult` interfaces
    - Create in `apps/web/src/lib/types/integration.ts`
    - _Requirements: 1.1, 2.4_
  - [x] 1.2 Create URL validation utility function
    - Implement `validateWebhookUrl(url: string): boolean` function
    - Must validate HTTPS URLs only
    - Create in `apps/web/src/lib/utils/validation.ts`
    - _Requirements: 1.2_
  - [ ]\* 1.3 Write property test for URL validation
    - **Property 1: URL Validation Correctness**
    - **Validates: Requirements 1.2**
  - [x] 1.4 Create JSON validation utility function
    - Implement `validateJsonTemplate(template: string): { valid: boolean; error?: string }`
    - Must handle `{{variable}}` placeholders by temporarily replacing them before JSON.parse
    - _Requirements: 2.3_
  - [ ]\* 1.5 Write property test for JSON validation
    - **Property 3: JSON Body Template Validation**
    - **Validates: Requirements 2.3**
  - [x] 1.6 Create template variable substitution function
    - Implement `substituteVariables(template: string, data: AnnotationData): string`
    - Support all documented variables: title, description, url, screenshot_url, page_title, priority, type, created_by.name, created_by.email, project.name, created_at
    - _Requirements: 2.4_
  - [ ]\* 1.7 Write property test for variable substitution
    - **Property 4: Variable Substitution Completeness**
    - **Validates: Requirements 2.4**

- [x] 2. Checkpoint - Ensure all utility tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create UI components

  - [x] 3.1 Create VariableReferencePanel component
    - Display list of available variables with name, description, and example
    - Style as a sidebar panel matching existing design patterns
    - Create in `apps/web/src/components/dashboard/VariableReferencePanel.tsx`
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 3.2 Create HeaderEditor component
    - Allow adding/removing key-value header pairs
    - Include add button and remove button per row
    - Create in `apps/web/src/components/dashboard/HeaderEditor.tsx`
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 3.3 Create BodyTemplateEditor component
    - Textarea for JSON body template input
    - Display validation error inline when JSON is invalid
    - Create in `apps/web/src/components/dashboard/BodyTemplateEditor.tsx`
    - _Requirements: 2.1, 2.3_
  - [x] 3.4 Create IntegrationForm component
    - Compose URL input, HeaderEditor, BodyTemplateEditor, and VariableReferencePanel
    - Include enable/disable toggle
    - Include Save and Test Webhook buttons
    - Handle form state and validation
    - Create in `apps/web/src/components/dashboard/IntegrationForm.tsx`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 5.1_
  - [x] 3.5 Export new components from dashboard index
    - Update `apps/web/src/components/dashboard/index.ts`
    - _Requirements: 1.1_

- [x] 4. Checkpoint - Verify components render correctly

  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create project settings page

  - [x] 5.1 Create project settings page
    - Create page at `apps/web/src/app/dashboard/[workspaceSlug]/projects/[projectSlug]/settings/page.tsx`
    - Include breadcrumb navigation
    - Integrate IntegrationForm component
    - Handle loading and error states
    - _Requirements: 1.1, 1.6_
  - [x] 5.2 Add settings link to project detail page
    - Add a settings icon/link in the project header
    - Update `apps/web/src/app/dashboard/[workspaceSlug]/projects/[projectSlug]/page.tsx`
    - _Requirements: 1.1_

- [x] 6. Implement form interactions

  - [x] 6.1 Implement save functionality
    - Wire up save button to call API (mock for now, API implementation is out of scope)
    - Show success/error feedback
    - _Requirements: 1.5_
  - [x] 6.2 Implement test webhook functionality
    - Wire up test button to call API (mock for now)
    - Display success message with status code on success
    - Display error message with reason on failure
    - _Requirements: 5.2, 5.3, 5.4_
  - [x] 6.3 Implement toggle functionality
    - Wire up enable/disable toggle
    - Persist toggle state with save
    - _Requirements: 4.1_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- This implementation focuses on UI only; backend API implementation is out of scope
- API calls will be mocked/stubbed until backend is implemented
- Follow existing design patterns from workspace settings page
