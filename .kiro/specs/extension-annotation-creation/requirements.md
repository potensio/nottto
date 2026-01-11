# Requirements Document

## Introduction

This feature enables users to create annotations from the Chrome extension and save them to the backend with proper image storage using Vercel Blob. The extension already has a capture and annotation UI in place; this feature completes the flow by integrating with the backend API for persistent storage. The design aligns with the existing dashboard UI patterns for viewing annotations.

## Glossary

- **Extension**: The Nottto Chrome browser extension for capturing and annotating screenshots
- **Annotation**: A screenshot capture with drawings, metadata (title, type, priority, description), and page context
- **Vercel_Blob**: Cloud storage service for hosting uploaded screenshot images
- **Screenshot_Annotated**: The final screenshot image with all annotations rendered (saved as PNG)
- **Base64_Data_URL**: A string encoding of image data in format "data:image/png;base64,..." - standard browser output from canvas.toDataURL()
- **API**: The Nottto backend REST API built with Hono

## Requirements

### Requirement 1: Screenshot Upload to Vercel Blob

**User Story:** As a user, I want my annotated screenshot to be uploaded to cloud storage, so that it persists and can be viewed from the dashboard.

#### Acceptance Criteria

1. WHEN the Extension saves an annotation with a screenshot THEN the API SHALL upload the Screenshot_Annotated to Vercel_Blob and return a public URL
2. WHEN the screenshot exceeds 10MB THEN the API SHALL reject the upload with a 413 error
3. WHEN the screenshot format is not PNG, JPEG, GIF, or WebP THEN the API SHALL reject the upload with a 400 error
4. WHEN the upload succeeds THEN the API SHALL store the Vercel_Blob URL in the annotation record

### Requirement 2: Annotation Creation from Extension

**User Story:** As a user, I want to save my annotations from the extension to my selected project, so that I can view and manage them from the dashboard.

#### Acceptance Criteria

1. WHEN the user clicks Save in the Extension THEN the Extension SHALL validate that a workspace and project are selected
2. WHEN validation fails THEN the Extension SHALL display an error toast with the specific validation message
3. WHEN the user saves an annotation THEN the Extension SHALL send the annotation data including title, description, type, priority, page URL, page title, and screenshot to the API
4. WHEN the API receives the annotation data THEN the API SHALL create a new annotation record linked to the specified project
5. WHEN the annotation is created successfully THEN the Extension SHALL display a success toast and close the overlay
6. IF the API returns an error THEN the Extension SHALL display an error toast and keep the overlay open for retry

### Requirement 3: Base64 Image Processing

**User Story:** As a developer, I want the API to accept base64-encoded screenshots, so that the extension can send image data directly in JSON without complex multipart form handling.

#### Acceptance Criteria

1. WHEN the Extension sends a Base64_Data_URL screenshot THEN the API SHALL decode and convert it to a file for upload
2. WHEN the base64 data is invalid or malformed THEN the API SHALL return a 400 error with a descriptive message
3. WHEN the base64 data is valid THEN the API SHALL upload the converted file to Vercel_Blob
4. THE API SHALL accept screenshotAnnotatedBase64 field containing the Base64_Data_URL in the create annotation request

### Requirement 4: Page Context Capture

**User Story:** As a user, I want the page URL and title to be automatically captured, so that I know where each annotation was created.

#### Acceptance Criteria

1. WHEN the Extension captures a screenshot THEN the Extension SHALL record the current page URL
2. WHEN the Extension captures a screenshot THEN the Extension SHALL record the current page title
3. WHEN the annotation is saved THEN the API SHALL store the page URL and page title in the annotation record

### Requirement 5: Loading and Error States

**User Story:** As a user, I want clear feedback during the save process, so that I know the status of my annotation.

#### Acceptance Criteria

1. WHEN the save operation starts THEN the Extension SHALL disable the Save button and show "Saving..." text
2. WHILE the save operation is in progress THEN the Extension SHALL prevent duplicate submissions
3. WHEN the save operation fails THEN the Extension SHALL re-enable the Save button for retry
4. WHEN the save operation succeeds THEN the Extension SHALL show a success message before closing

### Requirement 6: API Schema Updates

**User Story:** As a developer, I want the API to accept base64 screenshot data in the create annotation endpoint, so that the extension can submit screenshots inline.

#### Acceptance Criteria

1. THE createAnnotationSchema SHALL accept optional screenshotAnnotatedBase64 field as a string
2. WHEN the screenshotAnnotatedBase64 field is provided THEN the API SHALL process it and store the resulting URL in the screenshotAnnotated field
3. THE API SHALL continue to accept direct URL fields for backwards compatibility
