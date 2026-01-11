# Implementation Plan: Magic Link Authentication

## Overview

This implementation plan breaks down the magic link authentication feature into discrete coding tasks. The approach prioritizes backend infrastructure first, then web app UI, and finally extension integration. Each task builds incrementally on previous work.

## Tasks

- [x] 1. Database schema updates

  - [x] 1.1 Add magic_link_tokens table to Drizzle schema
    - Add table with id, email, tokenHash, expiresAt, createdAt, usedAt columns
    - Add indexes for email and expiresAt lookups
    - _Requirements: 7.1, 7.4_
  - [x] 1.2 Add rate_limit_records table to Drizzle schema
    - Add table with id, identifier, action, createdAt columns
    - Add composite index for efficient lookups
    - _Requirements: 6.6_
  - [x] 1.3 Make password_hash nullable in users table
    - Update users table schema to allow null passwordHash
    - _Requirements: 7.2_
  - [x] 1.4 Generate and run database migration
    - Run drizzle-kit generate and push migration
    - _Requirements: 7.1, 7.2_

- [ ] 2. Token generation and security utilities

  - [x] 2.1 Create token generation utility
    - Implement generateSecureToken() using crypto.randomBytes (32 bytes)
    - Implement hashToken() using SHA-256
    - Implement verifyTokenHash() for secure comparison
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ]\* 2.2 Write property test for token generation uniqueness
    - **Property 1: Token Generation Uniqueness**
    - **Validates: Requirements 1.2, 6.1**
  - [ ]\* 2.3 Write property test for token hash security
    - **Property 4: Token Hash Security**
    - **Validates: Requirements 6.2, 6.3**

- [ ] 3. Rate limiting service

  - [x] 3.1 Implement rate limiter service
    - Create checkLimit() to count requests within time window
    - Create recordRequest() to log new requests
    - Create cleanupOldRecords() for maintenance
    - Configure 5 requests per email per hour limit
    - _Requirements: 6.6, 6.7_
  - [ ]\* 3.2 Write property test for rate limit enforcement
    - **Property 5: Rate Limit Enforcement**
    - **Validates: Requirements 6.6, 6.7**

- [ ] 4. Email service with Resend

  - [x] 4.1 Set up Resend SDK and configuration
    - Install resend package
    - Add RESEND_API_KEY to environment variables
    - Create Resend client instance
    - _Requirements: 5.1_
  - [x] 4.2 Create magic link email template
    - Design HTML email with Nottto branding
    - Include magic link button/URL
    - Include expiration notice (15 minutes)
    - _Requirements: 5.2, 5.3, 5.4_
  - [x] 4.3 Implement sendMagicLinkEmail service function
    - Accept email and magic link URL
    - Send via Resend API
    - Handle errors and return appropriate responses
    - Log send events (without token)
    - _Requirements: 5.1, 5.5, 5.6_

- [ ] 5. Magic link API endpoints

  - [x] 5.1 Implement POST /auth/magic-link endpoint
    - Validate email format
    - Check rate limit
    - Generate secure token
    - Store hashed token with 15-minute expiration
    - Create user if doesn't exist
    - Send magic link email
    - Return success response with masked email
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  - [x] 5.2 Implement POST /auth/verify-magic-link endpoint
    - Accept token from request body
    - Look up token by hash
    - Validate token not expired
    - Validate token not already used
    - Mark token as used
    - Create default workspace/project for new users
    - Generate and return session tokens
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7_
  - [ ]\* 5.3 Write property test for token expiration enforcement
    - **Property 2: Token Expiration Enforcement**
    - **Validates: Requirements 1.2, 2.5**
  - [ ]\* 5.4 Write property test for token single-use guarantee
    - **Property 3: Token Single-Use Guarantee**
    - **Validates: Requirements 2.3, 2.6**
  - [ ]\* 5.5 Write property test for user creation idempotence
    - **Property 8: User Creation Idempotence**
    - **Validates: Requirements 1.6, 2.7**

- [x] 6. Checkpoint - Backend complete

  - Ensure all API tests pass
  - Verify Resend integration works with test email
  - Ask the user if questions arise

- [ ] 7. Web app auth page updates

  - [x] 7.1 Create email validation utility
    - Implement validateEmail() with regex pattern
    - Return validation result with error message
    - _Requirements: 1.5_
  - [ ]\* 7.2 Write property test for email validation
    - **Property 6: Email Validation**
    - **Validates: Requirements 1.5**
  - [x] 7.3 Update AuthPage component for magic link flow
    - Remove password fields and login/register toggle
    - Add email-only input form
    - Add loading state on submit
    - Add confirmation screen with "check your email" message
    - Add resend button with 60-second cooldown
    - Add "use different email" option
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  - [x] 7.4 Create /auth/verify page for magic link callback
    - Extract token from URL query params
    - Call verify-magic-link API
    - Handle success: store tokens, redirect to dashboard
    - Handle errors: show message with retry option
    - _Requirements: 2.1, 2.4, 2.5, 2.6_

- [ ] 8. Auth context and session management updates

  - [x] 8.1 Update auth-context for magic link flow
    - Remove login/register with password methods
    - Add requestMagicLink() method
    - Add verifyMagicLink() method
    - Update token refresh logic
    - _Requirements: 4.3, 4.4, 4.6_
  - [x] 8.2 Update api-client for magic link endpoints
    - Add requestMagicLink() API call
    - Add verifyMagicLink() API call
    - Ensure token refresh on 401 responses
    - _Requirements: 4.3_
  - [ ]\* 8.3 Write property test for session token validity
    - **Property 7: Session Token Validity**
    - **Validates: Requirements 4.1, 4.2**

- [x] 9. Checkpoint - Web app complete

  - Ensure auth flow works end-to-end in browser
  - Test magic link request, email receipt, verification
  - Ask the user if questions arise

- [ ] 10. Extension authentication integration

  - [x] 10.1 Create extension auth storage utilities
    - Implement saveTokens() to chrome.storage.local
    - Implement getTokens() to retrieve stored tokens
    - Implement clearTokens() for logout
    - Implement hasValidTokens() check
    - _Requirements: 3.4, 4.5_
  - [x] 10.2 Update extension API client for auth
    - Add token to Authorization header
    - Implement token refresh on 401
    - Handle refresh failure by clearing tokens
    - _Requirements: 3.5, 3.6, 3.7_
  - [x] 10.3 Create auth prompt UI for extension
    - Show "Sign in to Nottto" prompt when not authenticated
    - Add button to open web app auth page
    - _Requirements: 3.1, 3.2_
  - [x] 10.4 Implement web app to extension token communication
    - Add postMessage listener in extension
    - Send tokens from web app after successful auth
    - Store received tokens in extension
    - _Requirements: 3.3, 3.4_
  - [x] 10.5 Update extension background script for auth checks
    - Check auth state before capture
    - Show auth prompt if not authenticated
    - _Requirements: 3.1_

- [ ] 11. Token cleanup job

  - [x] 11.1 Implement expired token cleanup function
    - Delete magic_link_tokens where expiresAt < now or usedAt is set
    - Delete rate_limit_records older than 1 hour
    - _Requirements: 6.5, 7.5_

- [x] 12. Final checkpoint - All components integrated
  - Test full flow: extension → web auth → extension authenticated
  - Verify rate limiting works
  - Verify token expiration works
  - Ensure all tests pass
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation of each major component
- Property tests use fast-check library for TypeScript
- Environment variables needed: RESEND_API_KEY, JWT_SECRET, APP_URL
