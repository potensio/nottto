# Requirements Document

## Introduction

This feature enhances the Chrome extension's annotation form by adding a header section that displays the user's avatar and provides logout functionality. It also includes a review and improvement of the authentication implementation to ensure it follows Chrome extension best practices for secure backend communication.

## Glossary

- **Extension**: The Nottto Chrome browser extension for screenshot annotation
- **Annotation_Form**: The right-side panel in the extension overlay where users fill in annotation details
- **Form_Header**: A new header component at the top of the annotation form containing user info and workspace selector
- **User_Avatar**: A visual representation of the authenticated user, showing initials or profile image
- **Auth_Storage**: Chrome's local storage API used to persist authentication tokens and user data
- **Content_Script**: JavaScript that runs in the context of web pages
- **Background_Service_Worker**: The extension's background script that handles events and API calls
- **postMessage**: Browser API for cross-origin communication between windows

## Requirements

### Requirement 1: Secure Authentication Communication

**User Story:** As a developer, I want the extension to securely receive authentication tokens from the web app, so that user credentials are protected from malicious websites.

#### Acceptance Criteria

1. WHEN the auth listener receives a postMessage, THE Extension SHALL validate the message origin against a whitelist of allowed origins
2. WHEN the auth listener receives a valid auth message, THE Extension SHALL store tokens securely in chrome.storage.local
3. WHEN the auth listener receives a message from an untrusted origin, THE Extension SHALL ignore the message and not process any data
4. THE Extension SHALL use chrome.runtime messaging for communication between content scripts and background service worker

### Requirement 2: User Avatar Display

**User Story:** As a user, I want to see my avatar in the extension, so that I can confirm I'm logged in with the correct account.

#### Acceptance Criteria

1. WHEN the annotation form is displayed, THE Form_Header SHALL show the user's avatar
2. WHEN the user has a profile image URL, THE User_Avatar SHALL display the profile image
3. WHEN the user does not have a profile image, THE User_Avatar SHALL display the user's initials derived from their name or email
4. WHEN the user's name is null, THE User_Avatar SHALL derive initials from the first character of the email address

### Requirement 3: User Logout Functionality

**User Story:** As a user, I want to log out from the extension, so that I can switch accounts or protect my session on shared devices.

#### Acceptance Criteria

1. WHEN the user clicks on their avatar, THE Extension SHALL display a dropdown menu with logout option
2. WHEN the user clicks the logout option, THE Extension SHALL clear all stored authentication data
3. WHEN logout is complete, THE Extension SHALL close the annotation overlay
4. WHEN the user next activates the extension after logout, THE Extension SHALL show the authentication prompt

### Requirement 4: Form Header Layout

**User Story:** As a user, I want a clean header at the top of the annotation form, so that I can easily access workspace selection and account options.

#### Acceptance Criteria

1. THE Form_Header SHALL be positioned at the top of the annotation form panel
2. THE Form_Header SHALL contain the workspace selector on the left side
3. THE Form_Header SHALL contain the user avatar on the right side
4. THE Form_Header SHALL have a bottom border to visually separate it from the form content
5. WHEN the workspace selector is moved to the header, THE Extension SHALL remove the workspace row from the form body

### Requirement 5: Avatar Dropdown Menu

**User Story:** As a user, I want to access account options through my avatar, so that I can manage my session without leaving the annotation interface.

#### Acceptance Criteria

1. WHEN the user clicks the avatar, THE Extension SHALL display a dropdown menu
2. THE dropdown menu SHALL display the user's email address
3. THE dropdown menu SHALL include a "Sign out" option
4. WHEN the user clicks outside the dropdown, THE Extension SHALL close the dropdown menu
5. WHEN the user presses Escape while the dropdown is open, THE Extension SHALL close the dropdown menu
