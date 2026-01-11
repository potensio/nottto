# Requirements Document

## Introduction

This document specifies the requirements for implementing passwordless magic link authentication for Nottto. Users discover the app through the Chrome extension marketplace, and upon installation, they should be prompted to authenticate via the Next.js web app. Instead of traditional password-based authentication, users will receive a magic link via email (using Resend as the SMTP provider) to sign in or create an account seamlessly.

## Glossary

- **Magic_Link**: A unique, time-limited URL sent to a user's email that authenticates them when clicked
- **Auth_Token**: A cryptographically secure token embedded in the magic link URL
- **Session_Token**: JWT tokens (access and refresh) issued after successful magic link verification
- **Extension**: The Nottto Chrome browser extension
- **Web_App**: The Next.js dashboard application
- **API**: The Hono-based backend service
- **Resend**: Third-party email delivery service used for sending magic link emails

## Requirements

### Requirement 1: Magic Link Request

**User Story:** As a user, I want to enter my email address to receive a magic link, so that I can authenticate without remembering a password.

#### Acceptance Criteria

1. WHEN a user submits their email address on the auth page, THE Web_App SHALL send a request to the API to generate a magic link
2. WHEN the API receives a magic link request, THE API SHALL generate a cryptographically secure Auth_Token with a 15-minute expiration
3. WHEN the Auth_Token is generated, THE API SHALL store it in the database associated with the user's email
4. WHEN the Auth_Token is stored, THE API SHALL send an email via Resend containing the magic link URL
5. IF the email address is invalid format, THEN THE Web_App SHALL display a validation error without contacting the API
6. WHEN a magic link is requested for a non-existent email, THE API SHALL create a new user account and send the magic link (unified login/signup flow)
7. WHEN a magic link email is sent, THE Web_App SHALL display a confirmation message instructing the user to check their email

### Requirement 2: Magic Link Verification

**User Story:** As a user, I want to click the magic link in my email to be authenticated, so that I can access my account securely.

#### Acceptance Criteria

1. WHEN a user clicks a valid magic link, THE Web_App SHALL verify the Auth_Token with the API
2. WHEN the Auth_Token is valid and not expired, THE API SHALL issue Session_Tokens (access and refresh tokens)
3. WHEN Session_Tokens are issued, THE API SHALL invalidate the used Auth_Token to prevent reuse
4. WHEN authentication succeeds, THE Web_App SHALL store the Session_Tokens and redirect to the dashboard
5. IF the Auth_Token is expired, THEN THE Web_App SHALL display an error message with option to request a new magic link
6. IF the Auth_Token is invalid or already used, THEN THE Web_App SHALL display an appropriate error message
7. WHEN a new user is authenticated for the first time, THE API SHALL create a default workspace and project for them

### Requirement 3: Extension Authentication Flow

**User Story:** As a user who installed the extension, I want to be prompted to authenticate, so that I can use the extension's features with my account.

#### Acceptance Criteria

1. WHEN the Extension detects no stored authentication, THE Extension SHALL display a prompt to sign in
2. WHEN the user clicks the sign-in prompt, THE Extension SHALL open the Web_App auth page in a new browser tab
3. WHEN authentication completes in the Web_App, THE Web_App SHALL communicate the Session_Tokens to the Extension
4. WHEN the Extension receives Session_Tokens, THE Extension SHALL store them securely in chrome.storage
5. WHILE the Extension has valid Session_Tokens, THE Extension SHALL include them in API requests
6. IF the Extension's access token expires, THEN THE Extension SHALL attempt to refresh using the refresh token
7. IF the refresh token is invalid, THEN THE Extension SHALL prompt the user to re-authenticate

### Requirement 4: Session Management

**User Story:** As a user, I want my session to persist across browser restarts, so that I don't have to re-authenticate frequently.

#### Acceptance Criteria

1. WHEN Session_Tokens are issued, THE API SHALL set the access token expiration to 1 hour
2. WHEN Session_Tokens are issued, THE API SHALL set the refresh token expiration to 30 days
3. WHEN the Web_App detects an expired access token, THE Web_App SHALL automatically refresh it using the refresh token
4. WHEN a user logs out, THE Web_App SHALL clear all stored Session_Tokens
5. WHEN a user logs out, THE Extension SHALL clear its stored Session_Tokens
6. WHEN the refresh token expires, THE Web_App SHALL redirect the user to the auth page

### Requirement 5: Email Delivery

**User Story:** As a user, I want to receive the magic link email quickly and reliably, so that I can authenticate without delays.

#### Acceptance Criteria

1. WHEN sending a magic link email, THE API SHALL use Resend's API with proper authentication
2. WHEN composing the email, THE API SHALL include the Nottto branding and clear call-to-action
3. WHEN composing the email, THE API SHALL include the magic link URL that points to the Web_App verification endpoint
4. WHEN composing the email, THE API SHALL include information about the link expiration time
5. IF Resend API returns an error, THEN THE API SHALL return an appropriate error response to the client
6. WHEN the magic link email is sent, THE API SHALL log the event for debugging purposes (without logging the token)

### Requirement 6: Security

**User Story:** As a user, I want my authentication to be secure, so that my account is protected from unauthorized access.

#### Acceptance Criteria

1. THE Auth_Token SHALL be generated using cryptographically secure random bytes (minimum 32 bytes)
2. THE Auth_Token SHALL be hashed before storage in the database
3. WHEN verifying an Auth_Token, THE API SHALL compare hashes rather than plaintext tokens
4. THE magic link URL SHALL use HTTPS protocol only
5. WHEN an Auth_Token is used or expires, THE API SHALL delete it from the database
6. THE API SHALL implement rate limiting on magic link requests (maximum 5 requests per email per hour)
7. IF rate limit is exceeded, THEN THE API SHALL return a 429 status with retry-after information

### Requirement 7: Database Schema Updates

**User Story:** As a developer, I want the database schema to support magic link authentication, so that tokens can be stored and managed properly.

#### Acceptance Criteria

1. THE database SHALL have a magic_link_tokens table with columns for id, email, token_hash, expires_at, and created_at
2. THE users table SHALL have the password_hash column made nullable to support passwordless users
3. WHEN a magic link token is created, THE API SHALL store the hashed token with its expiration timestamp
4. THE database SHALL support efficient lookup of tokens by email address
5. THE API SHALL periodically clean up expired tokens from the database

### Requirement 8: Auth Page UI Updates

**User Story:** As a user, I want a simple and clear authentication interface, so that I can easily request and understand the magic link flow.

#### Acceptance Criteria

1. WHEN the auth page loads, THE Web_App SHALL display a single email input field with a submit button
2. THE Web_App SHALL NOT display password fields or login/register toggle
3. WHEN the user submits their email, THE Web_App SHALL display a loading state on the submit button
4. WHEN the magic link is sent, THE Web_App SHALL display a "check your email" confirmation screen
5. THE confirmation screen SHALL include the email address the link was sent to
6. THE confirmation screen SHALL include a "Resend link" button that becomes active after 60 seconds
7. WHEN on the confirmation screen, THE Web_App SHALL provide a "Use different email" option to return to the email input
