# Implementation Plan: Webhook Integration Backend

## Overview

This implementation plan covers the backend functionality for webhook integrations. The approach is to first add the database schema, then create the service layer, then the API routes, and finally integrate with annotation creation.

## Tasks

- [x] 1. Add database schema

  - [x] 1.1 Add webhookIntegrations table to schema
    - Add table definition with all fields (id, projectId, url, headers, bodyTemplate, enabled, locked, timestamps)
    - Add unique constraint on projectId
    - Add cascade delete on project deletion
    - Add relation to projects table
    - Update in `packages/shared/src/db/schema.ts`
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.2 Export types from schema
    - Export WebhookIntegrationRecord and NewWebhookIntegrationRecord types
    - Export from shared package index
    - _Requirements: 1.1_
  - [x] 1.3 Generate and run database migration
    - Run `pnpm drizzle-kit generate` to create migration
    - Apply migration to database
    - _Requirements: 1.1_

- [x] 2. Create integration service

  - [x] 2.1 Create integrations service file
    - Create `apps/api/src/services/integrations.ts`
    - Implement get(projectId, userId) function
    - Implement upsert(projectId, userId, data) function with lock check
    - Implement remove(projectId, userId) function
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 6.1, 6.2_
  - [x] 2.2 Add validation functions
    - Add validateWebhookUrl function (HTTPS only)
    - Add validateJsonTemplate function (with placeholder support)
    - _Requirements: 3.1, 3.2_
  - [x] 2.3 Implement test webhook function
    - Implement test(projectId, userId, data) function
    - Send actual HTTP request to configured URL
    - Return success/failure with status code
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 3. Create webhook executor service

  - [x] 3.1 Create webhook executor file
    - Create `apps/api/src/services/webhook-executor.ts`
    - Implement substituteVariables function
    - Implement executeWebhook function
    - Add 10 second timeout for requests
    - _Requirements: 4.2, 4.3, 4.4_
  - [x] 3.2 Add helper to get integration for project
    - Implement getEnabledIntegration(projectId) function
    - Returns integration only if enabled
    - _Requirements: 4.1_

- [x] 4. Create API routes

  - [x] 4.1 Create integrations routes file
    - Create `apps/api/src/routes/integrations.ts`
    - Add GET /projects/:projectId/integration route
    - Add PUT /projects/:projectId/integration route
    - Add DELETE /projects/:projectId/integration route
    - Add POST /projects/:projectId/integration/test route
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 4.2 Add Zod validation schemas
    - Create webhookIntegrationSchema for request validation
    - Add to shared package or inline
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 4.3 Register routes in server
    - Import and mount integration routes in `apps/api/src/server.ts`
    - _Requirements: 2.1_

- [x] 5. Integrate with annotation creation

  - [x] 5.1 Add webhook firing to annotation service
    - Modify `apps/api/src/services/annotations.ts`
    - Call webhook executor after annotation creation
    - Fire asynchronously (don't await)
    - Catch and log errors
    - _Requirements: 4.1, 4.5_
  - [ ]\* 5.2 Write property test for webhook execution
    - **Property 3: Webhook Fires on Annotation Creation**
    - **Validates: Requirements 4.1**
  - [ ]\* 5.3 Write property test for failure isolation
    - **Property 4: Webhook Failure Isolation**
    - **Validates: Requirements 4.5**

- [x] 6. Connect frontend to backend

  - [x] 6.1 Add API client methods
    - Add getIntegration(projectId) method
    - Add saveIntegration(projectId, data) method
    - Add deleteIntegration(projectId) method
    - Add testIntegration(projectId, data) method
    - Update `apps/web/src/lib/api-client.ts`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 6.2 Update integration page to use real API
    - Replace mock handlers with actual API calls
    - Add loading state for fetching existing integration
    - Update `apps/web/src/app/dashboard/[workspaceSlug]/projects/[projectSlug]/settings/page.tsx`
    - _Requirements: 1.6, 2.1_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The webhook executor fires asynchronously to not block annotation creation
- Lock check allows changing lock state but blocks other field changes when locked
- Database migration needs to be run manually after generation
