# Requirements Document

## Introduction

Backend API for the Nottto Chrome extension, providing authentication, workspace management, project organization, and annotation storage capabilities. This API enables users to save and manage bug reports captured via the extension, organized into workspaces and projects.

## Glossary

- **API**: The Hono-based backend service handling all HTTP requests
- **User**: An authenticated individual who can create and manage annotations
- **Workspace**: A top-level organizational container owned by a user, containing projects
- **Project**: A collection of annotations within a workspace
- **Annotation**: A bug report or feedback item with screenshots and metadata
- **JWT**: JSON Web Token used for authentication
- **Access_Token**: Short-lived JWT (15 minutes) for API authentication
- **Refresh_Token**: Long-lived token (7 days) for obtaining new access tokens

## Requirements

### Requirement 1: User Registration

**User Story:** As a new user, I want to create an account, so that I can save and manage my bug annotations.

#### Acceptance Criteria

1. WHEN a user submits valid registration data (email, password, name) THEN THE API SHALL create a new user account with a hashed password
2. WHEN a user registers successfully THEN THE API SHALL automatically create a default workspace named "My Workspace"
3. WHEN a user registers successfully THEN THE API SHALL automatically create a default project named "Default Project" in the default workspace
4. WHEN a user registers successfully THEN THE API SHALL return an access token and refresh token
5. WHEN a user attempts to register with an existing email THEN THE API SHALL return a 409 conflict error
6. WHEN a user submits an invalid email format THEN THE API SHALL return a 400 validation error
7. WHEN a user submits a password shorter than 8 characters THEN THE API SHALL return a 400 validation error

### Requirement 2: User Authentication

**User Story:** As a registered user, I want to log in to my account, so that I can access my workspaces and annotations.

#### Acceptance Criteria

1. WHEN a user submits valid login credentials THEN THE API SHALL return an access token and refresh token
2. WHEN a user submits invalid credentials THEN THE API SHALL return a 401 unauthorized error
3. WHEN a user provides a valid refresh token THEN THE API SHALL return a new access token
4. WHEN a user provides an expired or invalid refresh token THEN THE API SHALL return a 401 unauthorized error
5. WHEN an authenticated user requests their profile THEN THE API SHALL return the user's id, email, and name

### Requirement 3: Workspace Management

**User Story:** As a user, I want to create and manage workspaces, so that I can organize my projects by team or client.

#### Acceptance Criteria

1. WHEN an authenticated user requests their workspaces THEN THE API SHALL return all workspaces where the user is owner or member
2. WHEN an authenticated user creates a workspace with a valid name THEN THE API SHALL create the workspace and generate a unique slug
3. WHEN an authenticated user requests a specific workspace they own THEN THE API SHALL return the workspace details
4. WHEN an authenticated user updates a workspace they own THEN THE API SHALL update the workspace name and/or slug
5. WHEN an authenticated user deletes a workspace they own THEN THE API SHALL delete the workspace and all associated projects and annotations
6. WHEN an authenticated user attempts to access a workspace they don't own THEN THE API SHALL return a 403 forbidden error
7. WHEN a user creates a workspace with a duplicate slug THEN THE API SHALL return a 409 conflict error

### Requirement 4: Project Management

**User Story:** As a user, I want to create and manage projects within workspaces, so that I can organize annotations by feature or page.

#### Acceptance Criteria

1. WHEN an authenticated user requests projects for a workspace they own THEN THE API SHALL return all projects in that workspace
2. WHEN an authenticated user creates a project with a valid name in their workspace THEN THE API SHALL create the project and generate a unique slug within that workspace
3. WHEN an authenticated user requests a specific project they have access to THEN THE API SHALL return the project details
4. WHEN an authenticated user updates a project in their workspace THEN THE API SHALL update the project name, slug, and/or description
5. WHEN an authenticated user deletes a project in their workspace THEN THE API SHALL delete the project and all associated annotations
6. WHEN an authenticated user attempts to access a project in a workspace they don't own THEN THE API SHALL return a 403 forbidden error
7. WHEN a user creates a project with a duplicate slug within the same workspace THEN THE API SHALL return a 409 conflict error

### Requirement 5: Annotation Management

**User Story:** As a user, I want to create and manage annotations, so that I can track bugs and feedback for my projects.

#### Acceptance Criteria

1. WHEN an authenticated user requests annotations for a project they have access to THEN THE API SHALL return all annotations in that project
2. WHEN an authenticated user creates an annotation with required fields (title, project_id) THEN THE API SHALL create the annotation and associate it with the user
3. WHEN an authenticated user requests a specific annotation they created THEN THE API SHALL return the annotation details including screenshot URLs
4. WHEN an authenticated user updates an annotation they created THEN THE API SHALL update the annotation fields
5. WHEN an authenticated user deletes an annotation they created THEN THE API SHALL delete the annotation
6. WHEN an authenticated user attempts to access an annotation in a project they don't have access to THEN THE API SHALL return a 403 forbidden error
7. THE API SHALL support storing annotation metadata including type (bug, improvement, question), priority (urgent, high, medium, low), page URL, and page title

### Requirement 6: Screenshot Upload

**User Story:** As a user, I want to upload screenshots with my annotations, so that I can visually document bugs.

#### Acceptance Criteria

1. WHEN an authenticated user uploads a valid image file THEN THE API SHALL store the file in Vercel Blob and return the public URL
2. WHEN an authenticated user uploads a file exceeding 10MB THEN THE API SHALL return a 413 payload too large error
3. WHEN an authenticated user uploads a non-image file THEN THE API SHALL return a 400 validation error
4. THE API SHALL support both original screenshots and annotated screenshots for each annotation

### Requirement 7: API Security

**User Story:** As a system administrator, I want the API to be secure, so that user data is protected.

#### Acceptance Criteria

1. THE API SHALL require a valid access token for all endpoints except registration and login
2. WHEN an invalid or expired access token is provided THEN THE API SHALL return a 401 unauthorized error
3. THE API SHALL hash all passwords using bcrypt before storing
4. THE API SHALL use HTTPS for all communications in production
5. THE API SHALL validate and sanitize all input data using Zod schemas

### Requirement 8: Database Operations

**User Story:** As a developer, I want reliable database operations, so that data integrity is maintained.

#### Acceptance Criteria

1. THE API SHALL use Drizzle ORM for all database operations
2. WHEN a database operation fails THEN THE API SHALL return an appropriate error response without exposing internal details
3. THE API SHALL use transactions for operations that modify multiple tables (e.g., user registration with workspace creation)
4. WHEN deleting a workspace THEN THE API SHALL cascade delete all associated projects and annotations
5. WHEN deleting a project THEN THE API SHALL cascade delete all associated annotations
