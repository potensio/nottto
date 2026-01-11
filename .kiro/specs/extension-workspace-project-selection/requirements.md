# Requirements Document

## Introduction

This feature enhances the Chrome extension's annotation creation form to allow users to select a workspace and project directly from the extension. Users can select from existing workspaces (but cannot create new ones from the extension) and can either select an existing project or create a new one. The Next.js dashboard will also support project creation within workspaces.

## Glossary

- **Extension**: The Nottto Chrome browser extension used for capturing and annotating screenshots
- **Annotation_Form**: The right panel UI in the extension overlay where users enter annotation details
- **Workspace**: A container for organizing projects, owned by a user
- **Project**: A container within a workspace for grouping related annotations
- **Dashboard**: The Next.js web application for managing workspaces, projects, and annotations

## Requirements

### Requirement 1: Workspace Selection in Extension

**User Story:** As a user, I want to select a workspace from the annotation form in the Chrome extension, so that I can organize my annotations into the correct workspace.

#### Acceptance Criteria

1. WHEN the annotation form loads, THE Extension SHALL fetch and display a list of available workspaces for the authenticated user
2. WHEN workspaces are available, THE Extension SHALL display a workspace dropdown selector in the annotation form
3. WHEN a user selects a workspace, THE Extension SHALL store the selected workspace and enable project selection
4. WHEN no workspaces exist for the user, THE Extension SHALL display a message directing the user to create a workspace in the dashboard
5. IF the workspace fetch fails, THEN THE Extension SHALL display an error message and allow retry

### Requirement 2: Workspace Creation Restriction in Extension

**User Story:** As a product owner, I want to prevent workspace creation from the extension, so that workspace management remains centralized in the dashboard.

#### Acceptance Criteria

1. THE Extension SHALL NOT provide any UI controls for creating new workspaces
2. WHEN no workspaces exist, THE Extension SHALL display a link or message to create workspaces in the dashboard

### Requirement 3: Project Selection in Extension

**User Story:** As a user, I want to select or create a project from the annotation form in the Chrome extension, so that I can assign my annotation to the correct project.

#### Acceptance Criteria

1. WHEN a workspace is selected, THE Extension SHALL fetch and display projects for that workspace
2. WHEN projects are available, THE Extension SHALL display a project dropdown selector in the annotation form
3. WHEN a user selects a project, THE Extension SHALL store the selected project for the annotation
4. WHEN no projects exist in the selected workspace, THE Extension SHALL display an option to create a new project
5. IF the project fetch fails, THEN THE Extension SHALL display an error message and allow retry

### Requirement 4: Project Creation in Extension

**User Story:** As a user, I want to create a new project directly from the extension, so that I can quickly organize new annotations without switching to the dashboard.

#### Acceptance Criteria

1. WHEN a workspace is selected, THE Extension SHALL display an option to create a new project
2. WHEN a user initiates project creation, THE Extension SHALL display a project name input field
3. WHEN a user submits a valid project name, THE Extension SHALL create the project via the API
4. WHEN project creation succeeds, THE Extension SHALL automatically select the new project
5. IF project creation fails, THEN THE Extension SHALL display an error message and preserve the user's input
6. WHEN a user attempts to create a project with an empty name, THE Extension SHALL prevent submission and show validation feedback

### Requirement 5: Project Creation in Dashboard

**User Story:** As a user, I want to create new projects from the Next.js dashboard, so that I can manage my project organization from the web interface.

#### Acceptance Criteria

1. WHEN viewing a workspace in the dashboard, THE Dashboard SHALL display an option to create a new project
2. WHEN a user initiates project creation, THE Dashboard SHALL display a project creation form
3. WHEN a user submits a valid project name, THE Dashboard SHALL create the project via the API
4. WHEN project creation succeeds, THE Dashboard SHALL display the new project in the project list
5. IF project creation fails, THEN THE Dashboard SHALL display an error message
6. WHEN a user attempts to create a project with an empty name, THE Dashboard SHALL prevent submission and show validation feedback

### Requirement 6: Annotation Submission with Workspace and Project

**User Story:** As a user, I want my annotations to be saved to the selected workspace and project, so that they are properly organized.

#### Acceptance Criteria

1. WHEN saving an annotation, THE Extension SHALL include the selected project ID in the API request
2. WHEN no project is selected, THE Extension SHALL prevent annotation submission and prompt the user to select a project
3. WHEN annotation submission succeeds, THE Extension SHALL display a success message
4. IF annotation submission fails, THEN THE Extension SHALL display an error message and preserve the form data

### Requirement 7: Selection Persistence

**User Story:** As a user, I want my workspace and project selections to be remembered, so that I don't have to reselect them for each annotation.

#### Acceptance Criteria

1. WHEN a user selects a workspace, THE Extension SHALL persist the selection in local storage
2. WHEN a user selects a project, THE Extension SHALL persist the selection in local storage
3. WHEN the annotation form loads, THE Extension SHALL restore the previously selected workspace and project if they still exist
4. WHEN a previously selected workspace or project no longer exists, THE Extension SHALL clear the invalid selection and prompt the user to select again
