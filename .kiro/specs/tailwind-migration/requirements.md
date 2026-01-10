# Requirements Document

## Introduction

This document defines the requirements for migrating the BugFinder Chrome extension from inline CSS styles to Tailwind CSS utility classes. The project already has Tailwind configured but still uses inline styles in several places. The goal is to maximize Tailwind usage for consistency, maintainability, and smaller bundle size.

## Glossary

- **BugFinder_Extension**: The Chrome extension that provides screenshot annotation functionality
- **Tailwind_CSS**: A utility-first CSS framework used for styling
- **Inline_Style**: CSS applied directly via the `style` attribute on HTML elements
- **Utility_Class**: A single-purpose CSS class that applies one specific style
- **Component_Class**: A custom CSS class defined using Tailwind's `@apply` directive
- **Content_Script**: The JavaScript file (`content.js`) that creates the overlay UI

## Requirements

### Requirement 1: Migrate Inline Gradient Styles

**User Story:** As a developer, I want gradient styles defined as Tailwind utilities or component classes, so that I can maintain consistent styling without inline CSS.

#### Acceptance Criteria

1. WHEN the overlay header gradient is rendered, THE Content_Script SHALL use Tailwind classes instead of inline `style` attributes for the gradient background
2. THE Tailwind_Config SHALL define custom gradient utilities for the overlay header gradient

### Requirement 2: Migrate Inline Box Shadow Styles

**User Story:** As a developer, I want box shadow styles defined as Tailwind utilities, so that shadows are consistent and maintainable.

#### Acceptance Criteria

1. WHEN the canvas container shadow is rendered, THE Content_Script SHALL use Tailwind shadow classes instead of inline `style` attributes
2. WHEN the floating toolbar shadow is rendered, THE Content_Script SHALL use Tailwind shadow classes instead of inline `style` attributes
3. THE Tailwind_Config SHALL define custom shadow utilities for the canvas container and toolbar shadows

### Requirement 3: Migrate Inline Max-Height Styles

**User Story:** As a developer, I want max-height constraints defined as Tailwind utilities, so that layout constraints are consistent.

#### Acceptance Criteria

1. WHEN the canvas element max-height is set, THE Content_Script SHALL use Tailwind max-height classes instead of inline `style` attributes
2. THE Tailwind_Config SHALL define custom max-height utilities for viewport-relative calculations if needed

### Requirement 4: Preserve Visual Appearance

**User Story:** As a user, I want the extension to look exactly the same after the migration, so that my experience is unchanged.

#### Acceptance Criteria

1. WHEN the overlay is displayed, THE BugFinder_Extension SHALL render with identical visual appearance to the pre-migration version
2. WHEN annotations are created, THE BugFinder_Extension SHALL display them with identical styling to the pre-migration version

### Requirement 5: Maintain Build Process

**User Story:** As a developer, I want the Tailwind build process to continue working correctly, so that I can develop and build the extension.

#### Acceptance Criteria

1. WHEN running `npm run build`, THE Build_Process SHALL generate a valid `overlay.css` file containing all required utility classes
2. WHEN running `npm run build-css`, THE Build_Process SHALL watch for changes and regenerate CSS correctly
