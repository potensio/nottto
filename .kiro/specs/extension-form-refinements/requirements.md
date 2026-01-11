# Requirements Document

## Introduction

This document specifies UI refinements for the Chrome extension annotation form to improve user experience, visual consistency, and workflow efficiency. The changes focus on workspace/project selection improvements, form field styling enhancements, and removal of redundant elements.

## Glossary

- **Extension_Form**: The right panel in the annotation overlay containing form fields for creating annotations
- **Workspace_Selector**: A dropdown component in the form header for selecting the active workspace
- **Project_Selector**: A dropdown component for selecting the project within the chosen workspace
- **Selection_Storage**: Chrome storage mechanism for persisting user's workspace and project selections
- **Title_Input**: The main text input field for the annotation title
- **Description_Input**: The textarea for entering annotation description
- **Create_Project_Form**: The inline form for creating new projects within the extension

## Requirements

### Requirement 1: Workspace Selector Auto-Selection

**User Story:** As a user, I want the workspace selector to automatically select the first workspace when I have no previous selection, so that I can start creating annotations faster without manual selection.

#### Acceptance Criteria

1. WHEN the Extension_Form loads AND no previous workspace selection exists in Selection_Storage, THE Workspace_Selector SHALL automatically select the first available workspace
2. WHEN the first workspace is auto-selected, THE Extension_Form SHALL trigger project loading for that workspace
3. WHEN workspaces are loaded AND a previous selection exists in Selection_Storage, THE Workspace_Selector SHALL restore the previously selected workspace instead of auto-selecting

### Requirement 2: Persist Last Selected Workspace

**User Story:** As a user, I want my last selected workspace to be remembered across sessions, so that I don't have to switch workspaces every time I use the extension.

#### Acceptance Criteria

1. WHEN a user selects a workspace, THE Selection_Storage SHALL persist the workspace ID to chrome.storage.local
2. WHEN the Extension_Form loads, THE Workspace_Selector SHALL restore the previously selected workspace from Selection_Storage
3. WHEN the previously selected workspace no longer exists, THE Workspace_Selector SHALL fall back to auto-selecting the first available workspace

### Requirement 3: Relocate Project Creation Button

**User Story:** As a user, I want the project creation button to be positioned next to the "Project" label with a smaller design, so that the form layout is cleaner and more intuitive.

#### Acceptance Criteria

1. THE Create_Project button SHALL be positioned immediately after the "Project" label text
2. THE Create_Project button SHALL use a compact icon-only design with reduced padding
3. THE Create_Project button SHALL maintain the same functionality for showing the Create_Project_Form

### Requirement 4: Styled Project Creation Form

**User Story:** As a user, I want the project creation form to have a subtle card design that aligns with the overall form aesthetics, so that the interface feels cohesive.

#### Acceptance Criteria

1. THE Create_Project_Form input field SHALL have reduced width to align with other form elements
2. THE Create_Project_Form SHALL be wrapped in a subtle grey card container with rounded corners
3. THE Create_Project_Form card SHALL contain the project name input and both action buttons (Cancel, Create)
4. THE Create_Project_Form styling SHALL be visually consistent with the rest of the Extension_Form

### Requirement 5: Remove Reported By Section

**User Story:** As a user, I want the "Reported by" section removed from the form, so that the form is more streamlined since this information is redundant (the user is already shown in the header).

#### Acceptance Criteria

1. THE Extension_Form SHALL NOT display the "Reported by" row
2. WHEN the form is submitted, THE Extension_Form SHALL still associate the annotation with the current user

### Requirement 6: Improved Description Placeholder

**User Story:** As a user, I want the description placeholder text to be more helpful and guide me on what to write, so that I can provide better context for my annotations.

#### Acceptance Criteria

1. THE Description_Input placeholder SHALL display helpful guidance text that suggests what information to include
2. THE placeholder text SHALL be concise and actionable

### Requirement 7: Transparent Description Background

**User Story:** As a user, I want the description input to have an invisible background until focused, so that the form has a cleaner, more minimal appearance.

#### Acceptance Criteria

1. WHILE the Description_Input is not focused, THE Description_Input SHALL have a transparent background
2. WHEN the Description_Input receives focus, THE Description_Input SHALL display a subtle background color
3. THE Description_Input SHALL maintain its border styling for visual boundaries

### Requirement 8: Larger Title Input Font

**User Story:** As a user, I want the annotation title input to have a much larger font size, so that it stands out as the primary field and is easier to read while typing.

#### Acceptance Criteria

1. THE Title_Input font size SHALL be significantly larger than the current size
2. THE Title_Input SHALL maintain proper line height for readability
3. THE Title_Input SHALL continue to auto-resize based on content
