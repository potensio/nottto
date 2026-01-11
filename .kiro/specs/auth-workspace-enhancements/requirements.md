# Requirements Document

## Introduction

This document specifies the requirements for enhancing the authentication flow and workspace management in Nottto. The enhancements include distinguishing between login and registration flows (requiring full name for new users), using "Personal" as the default workspace name, adding a workspace settings page, and allowing users to select icons for their workspaces.

## Glossary

- **Auth_Page**: The authentication page at /auth where users sign in or register
- **Login_Flow**: The authentication flow for existing users who only need to provide their email
- **Register_Flow**: The authentication flow for new users who need to provide their email and full name
- **Workspace**: A container for organizing projects and annotations belonging to a user or team
- **Workspace_Icon**: A visual identifier (emoji or icon) that distinguishes one workspace from another
- **Settings_Page**: A dashboard page where users can view and modify workspace configuration
- **Personal_Workspace**: The default workspace created for new users, named "Personal"

## Requirements

### Requirement 1: Distinguish Login and Register Flows

**User Story:** As a user, I want to see different forms for login and registration, so that I can provide my full name when creating a new account.

#### Acceptance Criteria

1. WHEN the auth page loads, THE Auth_Page SHALL display options to toggle between login and register modes
2. WHEN in login mode, THE Auth_Page SHALL display only an email input field
3. WHEN in register mode, THE Auth_Page SHALL display both email and full name input fields
4. WHEN a user submits the register form, THE Auth_Page SHALL validate that the full name is not empty
5. WHEN a user submits the register form with valid data, THE API SHALL store the user's full name in the database
6. IF a user attempts to register with an existing email, THEN THE API SHALL return an error indicating the account exists
7. IF a user attempts to login with a non-existent email, THEN THE API SHALL return an error indicating no account found
8. WHEN switching between login and register modes, THE Auth_Page SHALL preserve the entered email address

### Requirement 2: Default Personal Workspace

**User Story:** As a new user, I want my first workspace to be named "Personal", so that I have a clear starting point for my work.

#### Acceptance Criteria

1. WHEN a new user completes registration, THE API SHALL create a default workspace named "Personal"
2. WHEN creating the Personal workspace, THE API SHALL generate a slug of "personal" for the workspace
3. IF the slug "personal" is already taken for that user, THEN THE API SHALL append a unique suffix
4. WHEN the Personal workspace is created, THE API SHALL also create a default project within it

### Requirement 3: Workspace Settings Page

**User Story:** As a user, I want to access a settings page for my workspace, so that I can view and modify workspace information.

#### Acceptance Criteria

1. WHEN a user navigates to /dashboard/[workspaceSlug]/settings, THE Settings_Page SHALL display the workspace settings form
2. THE Settings_Page SHALL display the current workspace name in an editable field
3. THE Settings_Page SHALL display the current workspace slug in an editable field
4. THE Settings_Page SHALL display the current workspace icon selector
5. WHEN a user modifies the workspace name and saves, THE API SHALL update the workspace name
6. WHEN a user modifies the workspace slug and saves, THE API SHALL validate uniqueness and update the slug
7. IF the new slug is already in use, THEN THE Settings_Page SHALL display an error message
8. WHEN a user saves valid changes, THE Settings_Page SHALL display a success confirmation
9. THE Settings_Page SHALL only be accessible to workspace owners

### Requirement 4: Workspace Icon Selection

**User Story:** As a user, I want to select an icon for my workspace, so that I can visually distinguish between different workspaces.

#### Acceptance Criteria

1. THE Workspace data model SHALL include an icon field to store the selected icon identifier
2. WHEN creating a new workspace, THE API SHALL assign a default icon
3. THE Settings_Page SHALL display an icon picker component with available icons
4. WHEN a user selects an icon, THE Settings_Page SHALL preview the selected icon
5. WHEN a user saves the workspace settings, THE API SHALL store the selected icon
6. WHEN displaying workspaces in the sidebar, THE Dashboard SHALL show the workspace icon next to the name
7. THE icon picker SHALL include a curated set of emoji icons suitable for workspace identification
8. WHEN no icon is selected, THE Dashboard SHALL display a default icon

### Requirement 5: Navigation to Settings

**User Story:** As a user, I want easy access to workspace settings, so that I can quickly manage my workspace configuration.

#### Acceptance Criteria

1. THE Dashboard sidebar SHALL include a settings link/button for the current workspace
2. WHEN a user clicks the settings link, THE Dashboard SHALL navigate to the workspace settings page
3. THE Settings_Page SHALL include a back button to return to the workspace dashboard
4. THE Settings_Page SHALL be accessible via the URL /dashboard/[workspaceSlug]/settings
