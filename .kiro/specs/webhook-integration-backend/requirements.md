# Requirements Document

## Introduction

This feature implements the backend functionality for project-level webhook integrations. It includes database storage for webhook configurations, API endpoints for CRUD operations, and the webhook execution logic that fires when annotations are created.

## Glossary

- **Webhook_Integration**: A database record storing the webhook configuration for a project
- **Integration_Service**: Backend service handling webhook configuration CRUD operations
- **Webhook_Executor**: Service that sends HTTP POST requests to configured endpoints when events occur
- **Project**: A container for annotations within a workspace
- **Annotation**: A bug report or feedback item created by users

## Requirements

### Requirement 1: Database Schema

**User Story:** As a system, I need to persist webhook integration configurations, so that they survive server restarts and can be retrieved when needed.

#### Acceptance Criteria

1. THE Database SHALL store webhook integrations with fields: id, projectId, url, headers (JSON), bodyTemplate, enabled, locked, createdAt, updatedAt
2. THE Database SHALL enforce a one-to-one relationship between projects and webhook integrations
3. WHEN a project is deleted, THE Database SHALL cascade delete the associated webhook integration

### Requirement 2: Integration API Endpoints

**User Story:** As a frontend application, I want API endpoints to manage webhook integrations, so that users can configure their integrations through the UI.

#### Acceptance Criteria

1. THE API SHALL provide GET /projects/:projectId/integration to retrieve the current integration configuration
2. THE API SHALL provide PUT /projects/:projectId/integration to create or update the integration configuration
3. THE API SHALL provide DELETE /projects/:projectId/integration to remove the integration configuration
4. THE API SHALL provide POST /projects/:projectId/integration/test to send a test webhook request
5. WHEN a user is not authorized for the project, THE API SHALL return 403 Forbidden

### Requirement 3: Integration Validation

**User Story:** As a system, I want to validate integration configurations before saving, so that invalid configurations don't cause runtime errors.

#### Acceptance Criteria

1. WHEN saving an integration, THE Integration_Service SHALL validate that the URL is a valid HTTPS URL
2. WHEN saving an integration, THE Integration_Service SHALL validate that the bodyTemplate is valid JSON (with placeholder support)
3. IF validation fails, THE API SHALL return 400 Bad Request with error details

### Requirement 4: Webhook Execution on Annotation Creation

**User Story:** As a user, I want webhooks to fire automatically when annotations are created, so that my external tools receive the data without manual intervention.

#### Acceptance Criteria

1. WHEN an annotation is created AND the project has an enabled webhook integration, THE Webhook_Executor SHALL send a POST request to the configured URL
2. THE Webhook_Executor SHALL substitute template variables in the body with actual annotation data
3. THE Webhook_Executor SHALL include configured custom headers in the request
4. THE Webhook_Executor SHALL always include Content-Type: application/json header
5. IF the webhook request fails, THE System SHALL log the error but not fail the annotation creation

### Requirement 5: Test Webhook Endpoint

**User Story:** As a user, I want to test my webhook configuration, so that I can verify it works before relying on it.

#### Acceptance Criteria

1. WHEN a test request is made, THE API SHALL send a sample payload to the configured URL
2. THE API SHALL return the HTTP status code from the webhook response
3. IF the request fails, THE API SHALL return the error message
4. THE test payload SHALL use sample annotation data with realistic values

### Requirement 6: Lock Configuration

**User Story:** As a user, I want to lock my webhook configuration, so that it cannot be accidentally modified.

#### Acceptance Criteria

1. THE Integration_Service SHALL store a locked boolean flag with the integration
2. WHEN an integration is locked, THE API SHALL reject update requests with 403 Forbidden
3. THE lock state itself CAN be toggled via the update endpoint (to allow unlocking)
