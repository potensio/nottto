# Design Document: Chrome Identity API Migration

## Overview

This design document outlines the migration from a custom polling-based OAuth flow to Chrome's recommended `chrome.identity.launchWebAuthFlow()` API with OAuth 2.0 and PKCE (Proof Key for Code Exchange). The new implementation will provide immediate authentication feedback, better security, and improved user experience while eliminating the inefficient 5-second polling mechanism.

The migration involves three main components:

1. **Extension**: Replace polling logic with `chrome.identity.launchWebAuthFlow()`
2. **Backend**: Implement OAuth 2.0 authorization and token endpoints with PKCE validation
3. **Web App**: Update authentication page to handle OAuth redirect flow

## Architecture

### High-Level Flow

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│  Extension  │                    │   Web App   │                    │   Backend   │
└──────┬──────┘                    └──────┬──────┘                    └──────┬──────┘
       │                                  │                                  │
       │ 1. Generate code_verifier        │                                  │
       │    and code_challenge            │                                  │
       │                                  │                                  │
       │ 2. launchWebAuthFlow()           │                                  │
       │    with code_challenge           │                                  │
       ├─────────────────────────────────>│                                  │
       │                                  │                                  │
       │                                  │ 3. User authenticates            │
       │                                  │    (magic link)                  │
       │                                  │                                  │
       │                                  │ 4. Request auth code             │
       │                                  ├─────────────────────────────────>│
       │                                  │                                  │
       │                                  │ 5. Return auth code              │
       │                                  │<─────────────────────────────────┤
       │                                  │                                  │
       │ 6. Redirect to extension URI     │                                  │
       │    with auth code                │                                  │
       │<─────────────────────────────────┤                                  │
       │                                  │                                  │
       │ 7. Exchange code for tokens      │                                  │
       │    with code_verifier            │                                  │
       ├──────────────────────────────────────────────────────────────────>│
       │                                  │                                  │
       │                                  │ 8. Validate PKCE                 │
       │                                  │    Return tokens                 │
       │<──────────────────────────────────────────────────────────────────┤
       │                                  │                                  │
       │ 9. Store tokens in               │                                  │
       │    chrome.storage.local          │                                  │
       │                                  │                                  │
```

### Component Interactions

**Extension → Backend:**

- OAuth authorization request (with code_challenge)
- Token exchange request (with code_verifier)
- API requests (with access_token)
- Token refresh requests (with refresh_token)

**Web App → Backend:**

- User authentication (magic link)
- Authorization code generation
- Redirect to extension

**Extension ↔ Chrome Identity API:**

- Launch OAuth flow
- Capture redirect URL
- Extract authorization code

## Components and Interfaces

### Extension Components

#### 1. OAuth Flow Manager (`utils/oauth-flow.ts`)

Manages the OAuth 2.0 with PKCE flow for extension authentication.

```typescript
interface OAuthFlowManager {
  /**
   * Starts the OAuth authentication flow
   * @param mode - 'login' or 'register'
   * @returns Promise with authentication result
   */
  startOAuthFlow(mode: "login" | "register"): Promise<AuthResult>;

  /**
   * Generates PKCE code verifier (43-128 characters)
   * @returns Base64-URL encoded random string
   */
  generateCodeVerifier(): string;

  /**
   * Generates PKCE code challenge from verifier
   * @param verifier - The code verifier
   * @returns Base64-URL encoded SHA-256 hash
   */
  generateCodeChallenge(verifier: string): Promise<string>;

  /**
   * Generates cryptographically secure state parameter
   * @returns Random state string
   */
  generateState(): string;

  /**
   * Builds the OAuth authorization URL
   * @param codeChallenge - PKCE code challenge
   * @param state - CSRF protection state
   * @param mode - 'login' or 'register'
   * @returns Complete authorization URL
   */
  buildAuthorizationUrl(
    codeChallenge: string,
    state: string,
    mode: "login" | "register",
  ): string;

  /**
   * Exchanges authorization code for tokens
   * @param code - Authorization code from redirect
   * @param codeVerifier - PKCE code verifier
   * @returns Access and refresh tokens
   */
  exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
  ): Promise<TokenResponse>;
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface User {
  id: string;
  email: string;
  name: string | null;
}
```

**Implementation Details:**

- **Code Verifier Generation**: Generate 32 bytes of cryptographically secure random data, then Base64-URL encode to produce a 43-character string
- **Code Challenge Generation**: SHA-256 hash the code verifier, then Base64-URL encode the result
- **State Generation**: Generate 16 bytes of cryptographically secure random data, then Base64-URL encode
- **Authorization URL**: `${WEB_URL}/auth/authorize?response_type=code&client_id=${EXTENSION_ID}&redirect_uri=${REDIRECT_URI}&code_challenge=${challenge}&code_challenge_method=S256&state=${state}&mode=${mode}`
- **Redirect URI**: `https://${chrome.runtime.id}.chromiumapp.org/oauth2`

#### 2. Chrome Identity Integration (`utils/chrome-identity.ts`)

Wrapper around Chrome's identity API for launching OAuth flows.

```typescript
interface ChromeIdentityService {
  /**
   * Launches the OAuth web auth flow
   * @param url - Authorization URL
   * @param interactive - Whether to show UI
   * @returns Promise with redirect URL containing auth code
   */
  launchWebAuthFlow(url: string, interactive: boolean): Promise<string>;

  /**
   * Extracts authorization code from redirect URL
   * @param redirectUrl - URL from launchWebAuthFlow
   * @returns Authorization code
   */
  extractAuthCode(redirectUrl: string): string;

  /**
   * Extracts state parameter from redirect URL
   * @param redirectUrl - URL from launchWebAuthFlow
   * @returns State parameter
   */
  extractState(redirectUrl: string): string;

  /**
   * Gets the extension's redirect URI
   * @returns Redirect URI for OAuth flow
   */
  getRedirectUri(): string;
}
```

**Implementation Details:**

- Use `chrome.identity.launchWebAuthFlow({ url, interactive: true })` to open OAuth window
- Parse redirect URL using `URLSearchParams` to extract `code` and `state` parameters
- Redirect URI format: `https://${chrome.runtime.id}.chromiumapp.org/oauth2`
- Handle errors: user cancellation, timeout, network errors

#### 3. Token Storage (`utils/auth-storage.ts`)

Existing module - minimal changes needed to maintain compatibility.

```typescript
// Existing interface - no changes needed
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Existing functions - no changes needed
function saveAuthState(tokens: AuthTokens, user: User): Promise<void>;
function getAccessToken(): Promise<string | null>;
function getRefreshToken(): Promise<string | null>;
function clearAuthState(): Promise<void>;
function hasValidTokens(): Promise<boolean>;
function updateAccessToken(accessToken: string): Promise<void>;
```

#### 4. Background Script Updates (`background/index.ts`)

Update message handler to use new OAuth flow instead of polling.

```typescript
// Replace startAuthFlow message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startAuthFlow") {
    // Use new OAuth flow instead of polling
    startOAuthFlow(message.mode)
      .then((result) => {
        broadcastAuthComplete(result.success);
        sendResponse({ success: result.success, user: result.user });
      })
      .catch((error) => {
        broadcastAuthComplete(false);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open
  }
  // ... other handlers
});
```

### Backend Components

#### 1. OAuth Authorization Endpoint (`routes/oauth.ts`)

Handles OAuth authorization requests and generates authorization codes.

```typescript
interface OAuthAuthorizationRequest {
  response_type: "code";
  client_id: string; // Extension ID
  redirect_uri: string; // https://<extension-id>.chromiumapp.org/oauth2
  code_challenge: string; // Base64-URL encoded SHA-256 hash
  code_challenge_method: "S256";
  state: string; // CSRF protection
  mode?: "login" | "register";
}

interface OAuthAuthorizationResponse {
  // Redirect to: redirect_uri?code=<auth_code>&state=<state>
  authorizationCode: string;
  expiresAt: Date;
}

// POST /oauth/authorize
// Validates request and generates authorization code
async function handleAuthorization(
  request: OAuthAuthorizationRequest,
  userId: string,
): Promise<OAuthAuthorizationResponse>;
```

**Implementation Details:**

- Validate `client_id` matches registered extension ID
- Validate `redirect_uri` matches pattern `https://<extension-id>.chromiumapp.org/*`
- Validate `code_challenge_method` is 'S256'
- Validate `code_challenge` is Base64-URL encoded string
- Generate authorization code (32-character nanoid)
- Store authorization code with code_challenge, user_id, expires_at (5 minutes)
- Return redirect URL with code and state

#### 2. OAuth Token Exchange Endpoint (`routes/oauth.ts`)

Exchanges authorization code for access and refresh tokens.

```typescript
interface OAuthTokenRequest {
  grant_type: "authorization_code";
  code: string; // Authorization code
  redirect_uri: string; // Must match original request
  code_verifier: string; // PKCE code verifier
  client_id: string; // Extension ID
}

interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number; // Seconds until expiration
}

// POST /oauth/token
// Validates PKCE and exchanges code for tokens
async function handleTokenExchange(
  request: OAuthTokenRequest,
): Promise<OAuthTokenResponse>;
```

**Implementation Details:**

- Validate authorization code exists and not expired
- Validate `redirect_uri` matches original request
- Validate `client_id` matches original request
- **PKCE Validation**:
  - Compute SHA-256 hash of `code_verifier`
  - Base64-URL encode the hash
  - Compare with stored `code_challenge`
  - Reject if mismatch
- Generate access token (JWT, 1 hour expiration)
- Generate refresh token (random string, 30 days expiration)
- Delete authorization code (one-time use)
- Return tokens

#### 3. OAuth Service (`services/oauth.ts`)

Business logic for OAuth operations.

```typescript
interface OAuthService {
  /**
   * Creates an authorization code for a user
   * @param userId - User ID
   * @param codeChallenge - PKCE code challenge
   * @param redirectUri - OAuth redirect URI
   * @param clientId - Extension ID
   * @returns Authorization code
   */
  createAuthorizationCode(
    userId: string,
    codeChallenge: string,
    redirectUri: string,
    clientId: string,
  ): Promise<string>;

  /**
   * Validates and exchanges authorization code for tokens
   * @param code - Authorization code
   * @param codeVerifier - PKCE code verifier
   * @param redirectUri - OAuth redirect URI
   * @param clientId - Extension ID
   * @returns Access and refresh tokens
   */
  exchangeAuthorizationCode(
    code: string,
    codeVerifier: string,
    redirectUri: string,
    clientId: string,
  ): Promise<TokenResponse>;

  /**
   * Validates PKCE code verifier against challenge
   * @param verifier - Code verifier
   * @param challenge - Stored code challenge
   * @returns True if valid
   */
  validatePKCE(verifier: string, challenge: string): Promise<boolean>;

  /**
   * Validates redirect URI format
   * @param uri - Redirect URI to validate
   * @param clientId - Extension ID
   * @returns True if valid
   */
  validateRedirectUri(uri: string, clientId: string): boolean;
}
```

**PKCE Validation Algorithm:**

```typescript
async function validatePKCE(
  verifier: string,
  challenge: string,
): Promise<boolean> {
  // 1. Compute SHA-256 hash of verifier
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // 2. Base64-URL encode the hash
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  // 3. Compare with stored challenge
  return hashBase64 === challenge;
}
```

#### 4. Database Schema Updates

Add new table for OAuth authorization codes:

```typescript
// New table: oauth_authorization_codes
interface OAuthAuthorizationCode {
  id: string; // Primary key (nanoid)
  userId: string; // Foreign key to users
  codeChallenge: string; // PKCE code challenge
  redirectUri: string; // OAuth redirect URI
  clientId: string; // Extension ID
  state: string; // CSRF state parameter
  expiresAt: Date; // 5 minutes from creation
  createdAt: Date;
}

// Remove table: extension_auth_sessions (no longer needed)
```

### Web App Components

#### 1. OAuth Authorization Page (`app/auth/authorize/page.tsx`)

New page that handles OAuth authorization flow.

```typescript
interface AuthorizePageProps {
  searchParams: {
    response_type: string;
    client_id: string;
    redirect_uri: string;
    code_challenge: string;
    code_challenge_method: string;
    state: string;
    mode?: "login" | "register";
  };
}

// Flow:
// 1. User lands on /auth/authorize with OAuth parameters
// 2. If not authenticated, show magic link login/register form
// 3. After authentication, generate authorization code
// 4. Redirect to redirect_uri with code and state
```

**Implementation Details:**

- Store OAuth parameters in session during authentication
- After magic link verification, retrieve OAuth parameters
- Call backend to generate authorization code
- Redirect to `${redirect_uri}?code=${authCode}&state=${state}`
- Handle errors with user-friendly messages

#### 2. Magic Link Verification Updates (`app/auth/verify/page.tsx`)

Update to handle OAuth flow after verification.

```typescript
// After successful magic link verification:
// 1. Check if OAuth parameters exist in session
// 2. If yes, generate authorization code and redirect
// 3. If no, redirect to dashboard (normal flow)
```

## Data Models

### OAuth Authorization Code (New)

```typescript
interface OAuthAuthorizationCode {
  id: string; // nanoid(32)
  userId: string; // User who authorized
  codeChallenge: string; // PKCE code challenge (Base64-URL)
  redirectUri: string; // OAuth redirect URI
  clientId: string; // Extension ID
  state: string; // CSRF state parameter
  expiresAt: Date; // 5 minutes from creation
  createdAt: Date;
}
```

**Indexes:**

- Primary key: `id`
- Index on `userId` for cleanup queries
- Index on `expiresAt` for cleanup queries

### Extension Auth Session (Remove)

The `extension_auth_sessions` table will be removed as it's no longer needed with the OAuth flow.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: PKCE Round Trip Validation

_For any_ code verifier, computing its SHA-256 hash and Base64-URL encoding to produce a code challenge, then validating that verifier against the challenge, should always succeed.

**Validates: Requirements 2.2, 2.5, 5.4, 5.7, 10.2**

### Property 2: PKCE Challenge Generation Determinism

_For any_ code verifier, generating the code challenge multiple times should always produce the same result.

**Validates: Requirements 2.2, 10.2**

### Property 3: PKCE Validation Rejects Mismatched Verifiers

_For any_ two different code verifiers, validating one verifier against the challenge generated from the other verifier should always fail.

**Validates: Requirements 2.5, 5.4**

### Property 4: Authorization Code Single Use

_For any_ authorization code, after it is successfully exchanged for tokens, attempting to exchange it again should fail with an error.

**Validates: Requirements 5.5**

### Property 5: Authorization Code Expiration

_For any_ authorization code, attempting to exchange it after its expiration time should fail with an error.

**Validates: Requirements 5.5**

### Property 6: Redirect URI Format Validation

_For any_ redirect URI, it should be accepted if and only if it matches the pattern `https://<client-id>.chromiumapp.org/*` where client-id is a valid 32-character extension ID.

**Validates: Requirements 1.3, 5.6**

### Property 7: State Parameter Round Trip

_For any_ state parameter included in the authorization request, the same state parameter should be returned in the redirect URL.

**Validates: Requirements 2.6, 2.7**

### Property 8: Token Storage with Expiration

_For any_ valid tokens with expiration timestamps stored in chrome.storage.local, retrieving them immediately after storage should return the same token values and expiration timestamps.

**Validates: Requirements 6.1, 6.3**

### Property 9: Token Refresh on Expiration

_For any_ stored access token that has expired, attempting to use it should trigger an automatic refresh using the refresh token.

**Validates: Requirements 6.4**

### Property 10: Token Cleanup on Logout

_For any_ authentication state, after logout is called, no tokens should remain in chrome.storage.local.

**Validates: Requirements 6.6**

### Property 11: OAuth Flow Cancellation Handling

_For any_ OAuth flow that is cancelled by the user, the extension should handle the cancellation gracefully without storing invalid tokens or leaving the system in an inconsistent state.

**Validates: Requirements 7.6**

### Property 12: Code Verifier Format Validation

_For any_ generated code verifier, it should be a Base64-URL encoded string between 43 and 128 characters in length.

**Validates: Requirements 2.1, 10.1**

### Property 13: Authorization URL Contains Required Parameters

_For any_ generated authorization URL, it should contain all required OAuth parameters: response_type, client_id, redirect_uri, code_challenge, code_challenge_method, and state.

**Validates: Requirements 2.3, 2.6**

### Property 14: Token Exchange Request Contains Verifier

_For any_ token exchange request, it should include the code verifier parameter.

**Validates: Requirements 2.4**

### Property 15: Rate Limiting Enforcement

_For any_ client making requests to OAuth endpoints, after exceeding the rate limit, subsequent requests should be rejected with a 429 status code until the rate limit window resets.

**Validates: Requirements 10.5, 10.7**

## Error Handling

### Extension Error Scenarios

| Error Scenario                      | Detection                       | User Message                              | Recovery Action |
| ----------------------------------- | ------------------------------- | ----------------------------------------- | --------------- |
| User cancels OAuth flow             | `chrome.identity` returns error | "Authentication cancelled"                | Allow retry     |
| OAuth window timeout                | No redirect after 5 minutes     | "Authentication timed out"                | Allow retry     |
| Network error during token exchange | Fetch fails                     | "Network error, please try again"         | Allow retry     |
| Invalid authorization code          | Backend returns 400             | "Authentication failed, please try again" | Restart flow    |
| PKCE validation failure             | Backend returns 400             | "Security validation failed"              | Restart flow    |
| Token storage failure               | chrome.storage error            | "Failed to save authentication"           | Restart flow    |

### Backend Error Scenarios

| Error Scenario                | HTTP Status | Error Response                     | Action          |
| ----------------------------- | ----------- | ---------------------------------- | --------------- |
| Invalid client_id             | 400         | `{ error: 'invalid_client' }`      | Reject request  |
| Invalid redirect_uri          | 400         | `{ error: 'invalid_request' }`     | Reject request  |
| Missing code_challenge        | 400         | `{ error: 'invalid_request' }`     | Reject request  |
| Invalid code_challenge_method | 400         | `{ error: 'invalid_request' }`     | Reject request  |
| Expired authorization code    | 400         | `{ error: 'invalid_grant' }`       | Reject request  |
| Invalid code_verifier         | 400         | `{ error: 'invalid_grant' }`       | Reject request  |
| Authorization code not found  | 400         | `{ error: 'invalid_grant' }`       | Reject request  |
| Rate limit exceeded           | 429         | `{ error: 'rate_limit_exceeded' }` | Temporary block |

### Error Logging

**Extension:**

- Log all errors to console with context
- Include error type, message, and stack trace
- Do not log sensitive data (tokens, codes)

**Backend:**

- Log all authentication attempts
- Log all errors with request context
- Include timestamp, client_id, user_id (if available)
- Monitor for suspicious patterns

## Testing Strategy

### Manual Testing

**Extension OAuth Flow:**

1. Click extension icon when not authenticated
2. Verify OAuth window opens with correct URL
3. Complete authentication in OAuth window
4. Verify window closes automatically
5. Verify extension shows authenticated state
6. Verify tokens are stored in chrome.storage.local

**Error Scenarios:**

1. Cancel OAuth window manually - verify graceful handling
2. Disconnect network during token exchange - verify error message
3. Use expired authorization code - verify error message

### Backend Unit Tests

**PKCE Validation:**

```typescript
describe("PKCE Validation", () => {
  it("should validate correct code verifier", async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const isValid = await validatePKCE(verifier, challenge);
    expect(isValid).toBe(true);
  });

  it("should reject incorrect code verifier", async () => {
    const verifier1 = generateCodeVerifier();
    const verifier2 = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier1);
    const isValid = await validatePKCE(verifier2, challenge);
    expect(isValid).toBe(false);
  });
});
```

**Authorization Code Expiration:**

```typescript
describe("Authorization Code", () => {
  it("should reject expired authorization code", async () => {
    // Create code with past expiration
    const code = await createAuthorizationCode(
      userId,
      challenge,
      redirectUri,
      clientId,
    );
    // Manually set expiration to past
    await updateCodeExpiration(code, new Date(Date.now() - 1000));
    // Attempt exchange
    await expect(
      exchangeAuthorizationCode(code, verifier, redirectUri, clientId),
    ).rejects.toThrow("invalid_grant");
  });
});
```

## Migration Plan

### Phase 1: Backend Implementation (No User Impact)

1. Create OAuth routes and endpoints
2. Implement PKCE validation logic
3. Add database table for authorization codes
4. Deploy backend changes
5. Test OAuth endpoints with Postman/curl

### Phase 2: Extension Implementation

1. Implement OAuth flow manager
2. Implement Chrome identity integration
3. Update background script
4. Update manifest.json with oauth2 config
5. Test locally with unpacked extension

### Phase 3: Web App Updates

1. Create OAuth authorization page
2. Update magic link verification flow
3. Test complete flow end-to-end

### Phase 4: Cleanup

1. Remove polling code from extension
2. Remove session endpoints from backend
3. Drop extension_auth_sessions table
4. Update documentation

### Phase 5: Deployment

1. Deploy backend changes
2. Deploy web app changes
3. Publish extension update to Chrome Web Store
4. Monitor for errors

## Security Considerations

### PKCE Implementation

- **Code Verifier**: 32 bytes of cryptographically secure random data (43 characters Base64-URL encoded)
- **Code Challenge**: SHA-256 hash of verifier, Base64-URL encoded
- **State Parameter**: 16 bytes of cryptographically secure random data
- **Challenge Method**: Only S256 supported (SHA-256)

### Token Security

- **Access Token**: JWT with 1 hour expiration
- **Refresh Token**: Random string with 30 days expiration
- **Storage**: chrome.storage.local (encrypted by Chrome)
- **Transmission**: HTTPS only

### Rate Limiting

- **Authorization Endpoint**: 10 requests per minute per IP
- **Token Endpoint**: 5 requests per minute per IP
- **Temporary Block**: 15 minutes after rate limit exceeded

### Validation Checks

- Client ID must match registered extension ID
- Redirect URI must match pattern `https://<extension-id>.chromiumapp.org/*`
- Code challenge must be Base64-URL encoded
- Code verifier must be 43-128 characters
- Authorization code expires in 5 minutes
- Authorization code is single-use only

## Performance Considerations

### Latency Improvements

**Current (Polling):**

- Average auth time: 5-10 seconds (depends on poll timing)
- Worst case: 15 seconds (if user completes just after poll)
- Network requests: 120+ polls over 10 minutes

**New (OAuth Redirect):**

- Average auth time: <1 second after user completes
- Worst case: 2 seconds (network latency)
- Network requests: 2 (authorization + token exchange)

### Resource Usage

**Current:**

- Continuous polling drains battery
- 120+ unnecessary network requests
- Backend processes 120+ poll requests per auth

**New:**

- No polling, no battery drain
- 2 network requests total
- Backend processes 2 requests per auth

## Manifest Changes

```json
{
  "manifest_version": 3,
  "name": "Notto - Screenshot Annotator",
  "version": "3.0.0",
  "permissions": [
    "activeTab",
    "downloads",
    "scripting",
    "storage",
    "tabs",
    "identity"
  ],
  "oauth2": {
    "client_id": "<extension-id>",
    "scopes": []
  },
  "host_permissions": ["https://notto-api.vercel.app/*"]
}
```

**Changes:**

- Add `"identity"` permission
- Add `oauth2` configuration section
- Bump version to 3.0.0 (major change)

## API Endpoints

### New Endpoints

**POST /oauth/authorize**

- Request: OAuth authorization parameters
- Response: Redirect to extension with authorization code
- Authentication: Required (magic link)

**POST /oauth/token**

- Request: Authorization code + PKCE verifier
- Response: Access and refresh tokens
- Authentication: None (validated via PKCE)

### Deprecated Endpoints

**POST /extension-auth/session** - Remove
**GET /extension-auth/session/:sessionId** - Remove
**POST /extension-auth/session/:sessionId/complete** - Remove
**DELETE /extension-auth/session/:sessionId** - Remove

## Configuration

### Extension Config

```typescript
export const config = {
  WEB_URL: "https://notto.site",
  API_URL: "https://notto-api.vercel.app/api",
  OAUTH_CLIENT_ID: chrome.runtime.id,
  OAUTH_REDIRECT_URI: `https://${chrome.runtime.id}.chromiumapp.org/oauth2`,
  OAUTH_SCOPES: [], // No additional scopes needed
} as const;
```

### Backend Config

```typescript
export const oauthConfig = {
  AUTHORIZATION_CODE_EXPIRY: 5 * 60 * 1000, // 5 minutes
  ACCESS_TOKEN_EXPIRY: 60 * 60, // 1 hour (seconds)
  REFRESH_TOKEN_EXPIRY: 30 * 24 * 60 * 60, // 30 days (seconds)
  ALLOWED_REDIRECT_URI_PATTERN: /^https:\/\/[a-z]{32}\.chromiumapp\.org\/.*$/,
  CODE_CHALLENGE_METHOD: "S256",
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 10,
} as const;
```

## Documentation Updates

### Extension README

- Document new OAuth flow
- Remove polling mechanism documentation
- Add troubleshooting section for OAuth errors
- Update architecture diagrams

### API Documentation

- Document OAuth endpoints
- Provide example requests/responses
- Document PKCE requirements
- Mark old endpoints as deprecated

### Developer Guide

- Add OAuth flow implementation guide
- Document PKCE generation and validation
- Provide code examples
- Add security best practices
