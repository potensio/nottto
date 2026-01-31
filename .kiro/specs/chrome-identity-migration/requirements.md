# Requirements Document

## Introduction

This specification defines the requirements for migrating the Notto Chrome extension authentication system from a custom polling-based OAuth flow to Chrome's recommended patterns using the `chrome.identity` API. The current implementation uses a session-based polling mechanism where the extension polls the backend every 5 seconds to check if authentication is complete. This approach is inefficient, drains battery, and doesn't leverage Chrome's built-in security features.

The migration will implement a proper OAuth 2.0 flow with PKCE (Proof Key for Code Exchange) using `chrome.identity.launchWebAuthFlow()`, which provides immediate redirect-based authentication, better security, and improved user experience.

## Glossary

- **Extension**: The Notto Chrome extension that captures and annotates screenshots
- **Backend**: The Notto API server that handles authentication and data storage
- **Web_App**: The Notto web application used for authentication
- **Chrome_Identity_API**: Chrome's built-in API for OAuth authentication flows
- **PKCE**: Proof Key for Code Exchange, an OAuth 2.0 security extension
- **Auth_Session**: A temporary session created for authentication (current implementation)
- **OAuth_Flow**: The standard OAuth 2.0 authorization code flow with PKCE
- **Redirect_URI**: The Chrome extension redirect URI in format `https://<extension-id>.chromiumapp.org/*`
- **Access_Token**: JWT token used to authenticate API requests
- **Refresh_Token**: Long-lived token used to obtain new access tokens
- **Code_Verifier**: Random string used in PKCE flow
- **Code_Challenge**: SHA-256 hash of code verifier used in PKCE flow
- **Authorization_Code**: Temporary code exchanged for tokens in OAuth flow

## Requirements

### Requirement 1: Chrome Identity API Integration

**User Story:** As a developer, I want to use Chrome's identity API for authentication, so that the extension follows Chrome's recommended security patterns and leverages built-in features.

#### Acceptance Criteria

1. THE Extension SHALL use `chrome.identity.launchWebAuthFlow()` for all authentication flows
2. THE Extension SHALL configure the manifest with oauth2 client ID and scopes
3. THE Extension SHALL use redirect URIs in the format `https://<extension-id>.chromiumapp.org/*`
4. WHEN the extension initiates authentication, THE Extension SHALL open the OAuth flow in a new window
5. WHEN the OAuth flow completes, THE Chrome_Identity_API SHALL automatically capture the redirect and return the URL to the extension

### Requirement 2: OAuth 2.0 with PKCE Implementation

**User Story:** As a security engineer, I want the authentication flow to use OAuth 2.0 with PKCE, so that the system is protected against authorization code interception attacks.

#### Acceptance Criteria

1. WHEN starting authentication, THE Extension SHALL generate a random code verifier
2. WHEN starting authentication, THE Extension SHALL compute a SHA-256 code challenge from the code verifier
3. WHEN initiating the OAuth flow, THE Extension SHALL include the code challenge in the authorization URL
4. WHEN exchanging the authorization code for tokens, THE Extension SHALL include the code verifier
5. THE Backend SHALL verify the code challenge matches the code verifier during token exchange
6. THE Extension SHALL include a state parameter for CSRF protection
7. THE Backend SHALL validate the state parameter matches the original request

### Requirement 3: Polling Mechanism Removal

**User Story:** As a user, I want authentication to complete immediately after I log in, so that I don't experience delays or battery drain from polling.

#### Acceptance Criteria

1. THE Extension SHALL NOT poll the backend for authentication status
2. THE Extension SHALL receive authentication results immediately via OAuth redirect
3. THE Extension SHALL remove all session polling code from the codebase
4. THE Backend SHALL remove or deprecate session polling endpoints
5. WHEN authentication completes, THE Extension SHALL receive tokens within 1 second of redirect

### Requirement 4: Manifest Configuration

**User Story:** As a developer, I want the extension manifest properly configured for OAuth, so that Chrome can manage the authentication flow correctly.

#### Acceptance Criteria

1. THE Extension manifest SHALL include an oauth2 configuration section
2. THE Extension manifest SHALL specify the OAuth client ID
3. THE Extension manifest SHALL declare required OAuth scopes
4. THE Extension manifest SHALL include appropriate permissions for identity API
5. THE Extension manifest SHALL maintain backward compatibility with existing permissions

### Requirement 5: Backend OAuth Endpoint Support

**User Story:** As a backend developer, I want OAuth-compliant endpoints, so that the system follows standard OAuth 2.0 patterns.

#### Acceptance Criteria

1. THE Backend SHALL provide an OAuth authorization endpoint
2. THE Backend SHALL provide an OAuth token exchange endpoint
3. WHEN receiving an authorization request, THE Backend SHALL validate the code challenge
4. WHEN receiving a token exchange request, THE Backend SHALL verify the code verifier
5. WHEN token exchange succeeds, THE Backend SHALL return access and refresh tokens
6. THE Backend SHALL validate redirect URIs match the registered extension ID
7. THE Backend SHALL enforce PKCE validation for all extension OAuth flows

### Requirement 6: Token Storage and Management

**User Story:** As a user, I want my authentication tokens stored securely, so that my account remains protected.

#### Acceptance Criteria

1. THE Extension SHALL continue storing tokens in `chrome.storage.local`
2. THE Extension SHALL encrypt sensitive token data before storage
3. WHEN tokens are stored, THE Extension SHALL include expiration timestamps
4. WHEN access tokens expire, THE Extension SHALL automatically refresh them using the refresh token
5. WHEN refresh fails, THE Extension SHALL prompt the user to re-authenticate
6. THE Extension SHALL clear all stored tokens on logout

### Requirement 7: Authentication Flow User Experience

**User Story:** As a user, I want a smooth authentication experience, so that I can quickly start using the extension.

#### Acceptance Criteria

1. WHEN clicking "Sign in", THE Extension SHALL open the OAuth flow in a popup window
2. WHEN authentication completes, THE Extension SHALL automatically close the OAuth window
3. WHEN authentication succeeds, THE Extension SHALL display a success message
4. WHEN authentication fails, THE Extension SHALL display a clear error message
5. THE Extension SHALL support both login and registration flows through the OAuth window
6. WHEN the OAuth window is closed manually, THE Extension SHALL handle cancellation gracefully

### Requirement 8: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages when authentication fails, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN the OAuth flow is cancelled, THE Extension SHALL display "Authentication cancelled" message
2. WHEN the OAuth flow times out, THE Extension SHALL display "Authentication timed out" message
3. WHEN network errors occur, THE Extension SHALL display "Network error, please try again" message
4. WHEN the backend returns an error, THE Extension SHALL display the error message from the backend
5. WHEN PKCE validation fails, THE Backend SHALL return a descriptive error message
6. THE Extension SHALL log detailed error information to the console for debugging

### Requirement 9: Code Cleanup and Documentation

**User Story:** As a developer, I want clean, well-documented code, so that the authentication system is maintainable.

#### Acceptance Criteria

1. THE Extension SHALL remove all deprecated polling-based authentication code
2. THE Extension SHALL remove unused session management utilities
3. THE Backend SHALL remove the session polling endpoints and database table
4. THE Extension SHALL include inline documentation explaining the OAuth flow
5. THE Extension SHALL include JSDoc comments for all public authentication functions
6. THE Backend SHALL document the OAuth endpoints in API documentation

### Requirement 10: Security Enhancements

**User Story:** As a security engineer, I want enhanced security measures, so that user accounts are better protected.

#### Acceptance Criteria

1. THE Extension SHALL generate cryptographically secure random values for code verifier and state
2. THE Extension SHALL use SHA-256 for code challenge computation
3. THE Backend SHALL validate all OAuth parameters before processing requests
4. THE Backend SHALL enforce HTTPS for all OAuth endpoints
5. THE Backend SHALL implement rate limiting on OAuth endpoints
6. THE Backend SHALL log all authentication attempts for security monitoring
7. WHEN suspicious activity is detected, THE Backend SHALL temporarily block authentication attempts

### Requirement 11: Basic Testing

**User Story:** As a developer, I want minimal essential tests, so that core functionality is validated without over-engineering.

#### Acceptance Criteria

1. THE Extension SHALL include basic manual testing for the OAuth flow
2. THE Backend SHALL include basic unit tests for PKCE verification logic
3. THE Extension SHALL include basic error handling validation
