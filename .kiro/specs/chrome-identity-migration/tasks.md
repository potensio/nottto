# Implementation Plan: Chrome Identity API Migration

## Overview

This plan outlines the migration from a custom polling-based OAuth flow to Chrome's `chrome.identity.launchWebAuthFlow()` API with OAuth 2.0 and PKCE. The implementation will be done in phases to minimize risk and ensure each component works before moving to the next.

## Tasks

- [x] 1. Backend OAuth Infrastructure
  - [x] 1.1 Create OAuth database schema and migrations
    - Create `oauth_authorization_codes` table with fields: id, userId, codeChallenge, redirectUri, clientId, state, expiresAt, createdAt
    - Add indexes on userId and expiresAt for efficient queries
    - _Requirements: 5.1, 5.2_
  - [x] 1.2 Implement PKCE validation utility
    - Create `utils/pkce.ts` with SHA-256 hashing and Base64-URL encoding
    - Implement `validatePKCE(verifier, challenge)` function
    - Use Web Crypto API for SHA-256 computation
    - _Requirements: 2.5, 5.4, 10.2_
  - [x] 1.3 Create OAuth service layer
    - Implement `services/oauth.ts` with authorization code generation
    - Implement token exchange with PKCE validation
    - Implement redirect URI validation (pattern: `https://<extension-id>.chromiumapp.org/*`)
    - Add authorization code expiration logic (5 minutes)
    - Ensure single-use authorization codes (delete after exchange)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 1.4 Create OAuth API routes
    - Create `routes/oauth.ts` with POST /oauth/authorize endpoint
    - Create POST /oauth/token endpoint for token exchange
    - Add request validation using Zod schemas
    - Add rate limiting (10 req/min for authorize, 5 req/min for token)
    - _Requirements: 5.1, 5.2, 10.5_
  - [x] 1.5 Integrate OAuth routes into main API
    - Register OAuth routes in `src/index.ts`
    - Test endpoints with Postman/curl
    - _Requirements: 5.1, 5.2_

- [x] 2. Extension OAuth Flow Implementation
  - [x] 2.1 Create PKCE utilities
    - Create `utils/pkce.ts` with code verifier generation (32 bytes random, Base64-URL encoded)
    - Implement code challenge generation (SHA-256 hash of verifier, Base64-URL encoded)
    - Implement state parameter generation (16 bytes random, Base64-URL encoded)
    - Use `crypto.getRandomValues()` for cryptographic randomness
    - _Requirements: 2.1, 2.2, 10.1_
  - [x] 2.2 Create Chrome Identity API wrapper
    - Create `utils/chrome-identity.ts` with `launchWebAuthFlow()` wrapper
    - Implement redirect URL parsing to extract authorization code and state
    - Implement `getRedirectUri()` to generate extension redirect URI
    - Add error handling for user cancellation and timeouts
    - _Requirements: 1.1, 1.3, 1.5_
  - [x] 2.3 Implement OAuth flow manager
    - Create `utils/oauth-flow.ts` with `startOAuthFlow(mode)` function
    - Implement authorization URL building with all OAuth parameters
    - Implement token exchange API call with code verifier
    - Add state parameter validation
    - Store tokens using existing `auth-storage.ts` functions
    - _Requirements: 2.3, 2.4, 2.6, 2.7, 5.5, 6.1, 6.3_
  - [x] 2.4 Update background script
    - Replace `startAuthFlow` message handler to use new OAuth flow
    - Remove polling logic and session management
    - Update auth status broadcasting to use OAuth flow events
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 2.5 Update manifest.json
    - Add `"identity"` permission
    - Add `oauth2` configuration section with client_id
    - Bump version to 3.0.0
    - _Requirements: 1.2, 4.1, 4.2, 4.3, 4.4_

- [x] 3. Web App OAuth Authorization Page
  - [x] 3.1 Create OAuth authorization page
    - Create `app/auth/authorize/page.tsx` to handle OAuth parameters
    - Extract and validate OAuth parameters from URL (response_type, client_id, redirect_uri, code_challenge, code_challenge_method, state, mode)
    - Store OAuth parameters in session during authentication
    - Show magic link login/register form if user not authenticated
    - _Requirements: 5.1, 5.3_
  - [x] 3.2 Update magic link verification flow
    - Modify `app/auth/verify/page.tsx` to check for OAuth parameters in session
    - After successful verification, generate authorization code via backend API
    - Redirect to extension redirect_uri with code and state parameters
    - Handle normal flow (redirect to dashboard) if no OAuth parameters
    - _Requirements: 5.1, 5.5_
  - [x] 3.3 Update auth page to support OAuth flow
    - Modify `app/auth/page.tsx` to detect OAuth parameters
    - Redirect to `/auth/authorize` if OAuth parameters present
    - Maintain existing magic link flow for non-OAuth requests
    - _Requirements: 7.5_

- [x] 4. Error Handling and User Feedback
  - [x] 4.1 Implement extension error handling
    - Add error handling for OAuth cancellation (user closes window)
    - Add error handling for network failures during token exchange
    - Add error handling for invalid authorization codes
    - Add error handling for PKCE validation failures
    - Display user-friendly error messages in auth prompt
    - Log detailed errors to console for debugging
    - _Requirements: 7.6, 8.1, 8.2, 8.3, 8.4_
  - [x] 4.2 Implement backend error responses
    - Return appropriate OAuth error codes (invalid_client, invalid_request, invalid_grant)
    - Return descriptive error messages for PKCE validation failures
    - Add error logging for all authentication attempts
    - _Requirements: 8.4, 8.5, 10.6_

- [x] 5. Token Management
  - [x] 5.1 Implement token refresh logic
    - Update API request handler in `background/index.ts` to detect expired tokens
    - Implement automatic token refresh using refresh token
    - Handle refresh failures by prompting re-authentication
    - _Requirements: 6.4, 6.5_
  - [x] 5.2 Implement logout functionality
    - Ensure logout clears all tokens from chrome.storage.local
    - Clear any cached authentication state
    - _Requirements: 6.6_

- [x] 6. Cleanup and Migration
  - [x] 6.1 Remove polling code from extension
    - Delete `utils/extension-auth.ts` (old polling implementation)
    - Remove session polling logic from background script
    - Remove any references to session-based auth
    - _Requirements: 3.3, 9.1, 9.2_
  - [x] 6.2 Remove backend session endpoints
    - Delete `routes/extension-auth.ts` (old session endpoints)
    - Delete `services/extension-auth.ts` (old session service)
    - Remove extension-auth routes from main API
    - _Requirements: 3.4, 9.3_
  - [x] 6.3 Remove database session table
    - Create migration to drop `extension_auth_sessions` table
    - Run migration on database
    - _Requirements: 9.3_

- [x] 7. Testing and Validation
  - [x] 7.1 Test complete OAuth flow end-to-end
    - Test login flow: extension → web app → token exchange → authenticated state
    - Test registration flow: extension → web app → token exchange → authenticated state
    - Test error scenarios: cancellation, network errors, invalid codes
    - Test token refresh when access token expires
    - Test logout clears all tokens
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 5.5, 6.4, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  - [x] 7.2 Verify PKCE security
    - Manually test that mismatched code verifiers are rejected
    - Verify authorization codes expire after 5 minutes
    - Verify authorization codes can only be used once
    - Verify redirect URI validation works correctly
    - _Requirements: 2.5, 5.4, 5.5, 5.6_

- [ ]\* 8. Documentation
  - [ ]\* 8.1 Update code documentation
    - Add JSDoc comments to all OAuth-related functions
    - Document PKCE flow in inline comments
    - Document error handling patterns
    - _Requirements: 9.4, 9.5_
  - [ ]\* 8.2 Update API documentation
    - Document OAuth endpoints (POST /oauth/authorize, POST /oauth/token)
    - Document request/response formats
    - Document error codes and messages
    - _Requirements: 9.6_

## Notes

- Testing is kept minimal as requested - focus on end-to-end validation and security verification
- No backward compatibility needed since there are no existing users
- All polling code and session management will be completely removed
- OAuth flow provides immediate authentication feedback (no delays)
- PKCE ensures security without requiring client secrets
- Rate limiting protects against abuse
