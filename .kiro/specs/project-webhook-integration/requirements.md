# Requirements Document

## Introduction

This feature enables users to configure custom webhook integrations at the project level, allowing annotation creation events to be sent to external services like Linear, Jira, Asana, or any HTTP endpoint. Users can customize the request URL, headers, and body template with variable substitution to map annotation data to the destination API's expected format.

## Glossary

- **Webhook**: An HTTP POST request sent to a user-configured URL when an event occurs
- **Integration**: A configured webhook endpoint with URL, headers, and body template
- **Body_Template**: A JSON template containing placeholder variables (e.g., `{{title}}`) that get replaced with actual annotation data
- **Variable**: A placeholder in the format `{{field_name}}` that references annotation data fields
- **Project**: A container for annotations within a workspace, where integrations are configured

## Requirements

### Requirement 1: Integration Configuration UI

**User Story:** As a project owner, I want to configure a webhook integration for my project, so that annotation events are automatically sent to my external tools.

#### Acceptance Criteria

1. WHEN a user navigates to project settings, THE Integration_Settings_Page SHALL display a form to configure webhook integration
2. WHEN a user enters a webhook URL, THE Integration_Form SHALL validate that the URL is a valid HTTPS URL
3. WHEN a user adds custom headers, THE Integration_Form SHALL allow key-value pairs for HTTP headers
4. WHEN a user enters a body template, THE Integration_Form SHALL accept JSON with variable placeholders
5. WHEN a user saves the integration, THE Integration_Form SHALL persist the configuration to the database
6. WHEN an integration is already configured, THE Integration_Settings_Page SHALL display the existing configuration for editing

### Requirement 2: Body Template Editor

**User Story:** As a user, I want to write a custom JSON body template with variable substitution, so that I can format the webhook payload to match my destination API's requirements.

#### Acceptance Criteria

1. THE Body_Template_Editor SHALL display a textarea for entering JSON body templates
2. THE Body_Template_Editor SHALL display a list of available variables with descriptions
3. WHEN a user enters invalid JSON syntax, THE Body_Template_Editor SHALL display a validation error before saving
4. THE Body_Template_Editor SHALL support the following variables: `{{title}}`, `{{description}}`, `{{url}}`, `{{screenshot_url}}`, `{{page_title}}`, `{{priority}}`, `{{type}}`, `{{created_by.name}}`, `{{created_by.email}}`, `{{project.name}}`, `{{created_at}}`

### Requirement 3: Header Configuration

**User Story:** As a user, I want to add custom HTTP headers to my webhook requests, so that I can include authentication tokens and content type specifications.

#### Acceptance Criteria

1. THE Header_Configuration SHALL allow users to add multiple key-value header pairs
2. WHEN a user adds a header, THE Header_Configuration SHALL provide input fields for header name and value
3. THE Header_Configuration SHALL allow users to remove individual headers
4. WHEN no headers are configured, THE Integration SHALL send requests with only `Content-Type: application/json` as the default header

### Requirement 4: Integration Toggle

**User Story:** As a user, I want to enable or disable my webhook integration without deleting the configuration, so that I can temporarily pause notifications.

#### Acceptance Criteria

1. THE Integration_Settings_Page SHALL display a toggle to enable or disable the integration
2. WHEN the integration is disabled, THE System SHALL not send webhook requests for annotation events
3. WHEN the integration is re-enabled, THE System SHALL resume sending webhook requests using the saved configuration

### Requirement 5: Test Webhook

**User Story:** As a user, I want to test my webhook configuration before relying on it, so that I can verify the endpoint receives data correctly.

#### Acceptance Criteria

1. THE Integration_Settings_Page SHALL provide a "Test Webhook" button
2. WHEN a user clicks "Test Webhook", THE System SHALL send a sample payload to the configured URL
3. WHEN the test request succeeds, THE System SHALL display a success message with the response status
4. WHEN the test request fails, THE System SHALL display an error message with the failure reason

### Requirement 6: Variable Reference Panel

**User Story:** As a user, I want to see all available template variables and their descriptions, so that I can correctly format my webhook body.

#### Acceptance Criteria

1. THE Variable_Reference_Panel SHALL display all available variables in a visible sidebar or collapsible section
2. THE Variable_Reference_Panel SHALL show the variable name and a brief description for each variable
3. THE Variable_Reference_Panel SHALL show an example value for each variable
