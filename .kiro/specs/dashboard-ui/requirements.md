# Requirements Document

## Introduction

This document defines the requirements for the Nottto Dashboard UI - a web-based interface for managing workspaces, projects, and viewing annotated screenshots captured via the Chrome extension. The dashboard provides users with an overview of their bug reports and annotations, organized by workspace and project hierarchy.

## Glossary

- **Dashboard**: The main web application interface for viewing and managing annotations
- **Workspace**: A top-level organizational unit that contains projects (e.g., a company or team)
- **Project**: A collection of annotations within a workspace (e.g., a specific website or application)
- **Annotation**: A screenshot with visual annotations and metadata captured via the Chrome extension
- **Workspace_Selector**: A UI component for switching between workspaces
- **Annotation_Card**: A UI component displaying annotation thumbnail and metadata
- **Empty_State**: A UI component shown when no data exists, guiding users to take action

## Requirements

### Requirement 1: Workspace Selection

**User Story:** As a user with multiple workspaces, I want to select and switch between workspaces, so that I can view annotations for different teams or projects.

#### Acceptance Criteria

1. WHEN a user logs in with multiple workspaces, THE Dashboard SHALL display a workspace selector in the header
2. WHEN a user has only one workspace, THE Dashboard SHALL automatically select that workspace without showing a selector
3. WHEN a user selects a different workspace, THE Dashboard SHALL navigate to that workspace's dashboard view
4. WHEN a user has no workspaces, THE Dashboard SHALL display an empty state with a "Create Workspace" action

### Requirement 2: Dashboard Overview

**User Story:** As a user, I want to see an overview of my workspace activity, so that I can quickly understand the current state of bug reports.

#### Acceptance Criteria

1. WHEN a user views the dashboard, THE Dashboard SHALL display quick stats including total annotations count
2. WHEN a user views the dashboard, THE Dashboard SHALL display a list of recent annotations sorted by creation date (newest first)
3. WHEN a user views the dashboard, THE Dashboard SHALL display a sidebar or section listing all projects in the current workspace
4. WHEN the workspace has no annotations, THE Dashboard SHALL display an empty state with guidance to install the Chrome extension

### Requirement 3: Annotation List Display

**User Story:** As a user, I want to see my annotations in a scannable format, so that I can quickly find the bug report I'm looking for.

#### Acceptance Criteria

1. WHEN displaying an annotation, THE Annotation_Card SHALL show a thumbnail of the annotated screenshot
2. WHEN displaying an annotation, THE Annotation_Card SHALL show the title, priority badge, and project name
3. WHEN displaying an annotation, THE Annotation_Card SHALL show the page URL (truncated if too long) and creation date
4. WHEN a user clicks an annotation card, THE Dashboard SHALL navigate to the annotation detail view
5. WHEN annotations are loading, THE Dashboard SHALL display a loading skeleton state

### Requirement 4: Project Navigation

**User Story:** As a user, I want to browse annotations by project, so that I can focus on bugs for a specific application.

#### Acceptance Criteria

1. WHEN viewing the projects list, THE Dashboard SHALL display each project with its name and annotation count
2. WHEN a user clicks a project, THE Dashboard SHALL navigate to the project detail view showing only that project's annotations
3. WHEN a user is on a project detail view, THE Dashboard SHALL display a breadcrumb navigation back to the workspace dashboard
4. WHEN a project has no annotations, THE Dashboard SHALL display a project-specific empty state

### Requirement 5: Annotation Detail View

**User Story:** As a user, I want to view the full details of an annotation, so that I can understand and share the bug report.

#### Acceptance Criteria

1. WHEN viewing an annotation detail, THE Dashboard SHALL display the full annotated screenshot
2. WHEN viewing an annotation detail, THE Dashboard SHALL display all metadata (title, description, type, priority, page URL, page title)
3. WHEN viewing an annotation detail, THE Dashboard SHALL display the creation date and creator information
4. WHEN viewing an annotation detail, THE Dashboard SHALL provide a way to copy a shareable link
5. WHEN a user clicks back or breadcrumb, THE Dashboard SHALL return to the previous list view

### Requirement 6: Responsive Layout

**User Story:** As a user, I want to access the dashboard on different devices, so that I can review bug reports from anywhere.

#### Acceptance Criteria

1. WHEN viewed on desktop (≥1024px), THE Dashboard SHALL display a sidebar layout with projects list visible
2. WHEN viewed on tablet/mobile (<1024px), THE Dashboard SHALL collapse the sidebar into a mobile menu
3. WHEN viewed on any device, THE Annotation_Card grid SHALL adjust columns based on available width
4. WHEN viewed on mobile, THE Dashboard SHALL maintain touch-friendly tap targets (minimum 44px)

### Requirement 7: Navigation Structure

**User Story:** As a user, I want clear navigation paths, so that I can easily move between different views.

#### Acceptance Criteria

1. THE Dashboard SHALL implement the following route structure:
   - `/dashboard` - Workspace selector or redirect to default workspace
   - `/dashboard/[workspaceSlug]` - Workspace dashboard
   - `/dashboard/[workspaceSlug]/projects/[projectSlug]` - Project detail
   - `/dashboard/[workspaceSlug]/annotations/[id]` - Annotation detail
2. WHEN navigating between views, THE Dashboard SHALL update the browser URL for bookmarking and sharing
3. WHEN a user accesses an invalid route, THE Dashboard SHALL display a 404 page with navigation back to dashboard

### Requirement 8: Loading and Error States

**User Story:** As a user, I want clear feedback during data loading and errors, so that I understand the application state.

#### Acceptance Criteria

1. WHEN data is loading, THE Dashboard SHALL display appropriate skeleton loaders
2. IF an API request fails, THEN THE Dashboard SHALL display an error message with a retry option
3. WHEN the user is not authenticated, THE Dashboard SHALL redirect to the login page
4. WHEN a requested resource is not found, THE Dashboard SHALL display a 404 message

### Requirement 9: Visual Design Consistency

**User Story:** As a user, I want the dashboard to feel cohesive with the rest of the application, so that I have a seamless experience.

#### Acceptance Criteria

1. THE Dashboard SHALL use the established color palette:
   - Primary background: neutral-50 (#fafafa)
   - Text: neutral-900 (#171717) for headings, neutral-500 for secondary text
   - Accent color: #eb3b3b (red) for highlights and interactive elements
   - Cards: white background with neutral-200 borders
2. THE Dashboard SHALL use the established typography:
   - Headings: Instrument Serif font
   - Body text: Manrope font
   - Monospace elements: JetBrains Mono font
3. THE Dashboard SHALL use consistent component styling:
   - Rounded corners (rounded-lg for cards, rounded-full for buttons/badges)
   - Subtle shadows (shadow-sm for cards)
   - Glass panel effect for overlays (backdrop-blur with semi-transparent backgrounds)
4. THE Dashboard SHALL include subtle animated backgrounds consistent with the landing page (animated blobs, tech-grid)
5. THE Dashboard SHALL use Iconify icons (lucide icon set) for consistency with existing UI
