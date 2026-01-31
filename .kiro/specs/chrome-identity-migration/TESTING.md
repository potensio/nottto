# Chrome Identity Migration - Testing Guide

This document provides comprehensive testing procedures for the Chrome Identity API migration with OAuth 2.0 and PKCE.

## Automated Tests

### Backend Tests

All backend tests are located in `apps/api/src/` and can be run with:

```bash
cd apps/api
bun test
```

#### PKCE Utilities Tests (`utils/pkce.test.ts`)

Tests the core PKCE cryptographic functions:

- ✅ Validates correct code verifier against its challenge
- ✅ Rejects incorrect code verifier
- ✅ Rejects empty verifier or challenge
- ✅ Generates deterministic challenge from verifier
- ✅ Generates different challenges for different verifiers
- ✅ Generates Base64-URL encoded strings
- ✅ Generates 43-character challenges for 32-byte verifiers

**Coverage:** Requirements 2.2, 2.5, 5.4, 5.7, 10.2

#### OAuth Service Tests (`services/oauth.test.ts`)

Tests the OAuth authorization and token exchange flows:

**Authorization Code Creation:**

- ✅ Creates authorization code with valid parameters
- ✅ Rejects invalid redirect URI format
- ✅ Rejects redirect URI with mismatched client ID
- ✅ Sets expiration time to 5 minutes

**Token Exchange:**

- ✅ Exchanges valid authorization code for tokens
- ✅ Rejects invalid authorization code
- ✅ Rejects expired authorization code (after 5 minutes)
- ✅ Rejects mismatched code verifier (PKCE validation)
- ✅ Rejects mismatched redirect URI
- ✅ Rejects mismatched client ID
- ✅ Deletes authorization code after successful exchange (single-use)
- ✅ Rejects reused authorization code

**Redirect URI Validation:**

- ✅ Accepts valid Chrome extension redirect URI
- ✅ Accepts redirect URI with different paths
- ✅ Rejects non-HTTPS URI
- ✅ Rejects wrong domain
- ✅ Rejects mismatched extension ID
- ✅ Rejects invalid extension ID format
- ✅ Rejects extension ID with wrong length

**Cleanup:**

- ✅ Deletes expired authorization codes
- ✅ Does not delete valid authorization codes

**Coverage:** Requirements 1.3, 2.5, 5.1-5.7, 10.1-10.6

## Manual Testing Procedures

### Prerequisites

1. **Backend Running:** Start the API server

   ```bash
   cd apps/api
   pnpm dev
   ```

2. **Web App Running:** Start the Next.js web app

   ```bash
   cd apps/web
   pnpm dev
   ```

3. **Extension Built:** Build the Chrome extension

   ```bash
   cd apps/extension
   pnpm build
   ```

4. **Extension Loaded:** Load the unpacked extension in Chrome
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `apps/extension/dist` directory

### Test 7.1: Complete OAuth Flow End-to-End

#### Test 7.1.1: Login Flow (New User Registration)

**Objective:** Verify that a new user can register through the extension OAuth flow.

**Steps:**

1. Open Chrome DevTools Console (for extension debugging)
2. Click the Notto extension icon
3. Click "Sign in" or trigger authentication
4. Observe OAuth window opens with web app authorization page
5. Enter email address in the registration form
6. Check email for magic link
7. Click magic link in email
8. Observe automatic redirect back to extension
9. Verify extension shows authenticated state
10. Verify user information is displayed correctly

**Expected Results:**

- OAuth window opens successfully
- Magic link email is received
- After clicking magic link, redirect occurs with authorization code
- Extension receives tokens and stores them
- User is authenticated and can use extension features
- Console logs show successful OAuth flow completion

**Validation:**

- Check `chrome.storage.local` for stored tokens
- Verify access token and refresh token are present
- Verify user data is stored correctly
- Check backend logs for successful token exchange

**Coverage:** Requirements 1.1, 2.1-2.7, 5.1-5.5, 7.1, 7.2, 7.5

#### Test 7.1.2: Login Flow (Existing User)

**Objective:** Verify that an existing user can log in through the extension OAuth flow.

**Steps:**

1. Ensure user account exists (from previous test or create manually)
2. Clear extension storage: `chrome.storage.local.clear()`
3. Click the Notto extension icon
4. Click "Sign in"
5. Enter existing email address
6. Check email for magic link
7. Click magic link
8. Observe automatic redirect and authentication

**Expected Results:**

- Same flow as registration
- User is authenticated with existing account
- Previous user data is retrieved

**Coverage:** Requirements 1.1, 2.1-2.7, 5.1-5.5, 7.1, 7.2, 7.5

#### Test 7.1.3: OAuth Cancellation

**Objective:** Verify graceful handling when user cancels OAuth flow.

**Steps:**

1. Clear extension storage
2. Click "Sign in" in extension
3. When OAuth window opens, close it manually (click X or press Escape)
4. Observe extension behavior

**Expected Results:**

- Extension displays "Authentication cancelled" message
- No tokens are stored
- Extension remains in unauthenticated state
- No errors in console
- User can retry authentication

**Coverage:** Requirements 7.6, 8.1

#### Test 7.1.4: Network Error During Token Exchange

**Objective:** Verify error handling when network fails during token exchange.

**Steps:**

1. Clear extension storage
2. Start OAuth flow
3. Complete magic link verification
4. Before redirect completes, disconnect network or stop API server
5. Observe error handling

**Expected Results:**

- Extension displays "Network error" message
- No invalid tokens are stored
- User can retry authentication
- Error is logged to console

**Coverage:** Requirements 8.3

#### Test 7.1.5: Invalid Authorization Code

**Objective:** Verify handling of invalid authorization codes.

**Steps:**

1. Manually construct invalid redirect URL with fake authorization code
2. Attempt to complete OAuth flow with invalid code

**Expected Results:**

- Backend rejects invalid code with 400 error
- Extension displays "Authentication failed" message
- No tokens are stored

**Coverage:** Requirements 8.4

#### Test 7.1.6: Token Refresh When Access Token Expires

**Objective:** Verify automatic token refresh functionality.

**Steps:**

1. Authenticate successfully
2. Manually expire access token in storage (set `expiresAt` to past date)
3. Make an API request through extension (e.g., create annotation)
4. Observe automatic token refresh

**Expected Results:**

- Extension detects expired token
- Automatically requests new access token using refresh token
- New access token is stored
- API request succeeds with new token
- User experiences no interruption

**Coverage:** Requirements 6.4, 6.5

#### Test 7.1.7: Logout Clears All Tokens

**Objective:** Verify that logout properly clears all authentication data.

**Steps:**

1. Authenticate successfully
2. Verify tokens are stored in `chrome.storage.local`
3. Click "Logout" in extension
4. Check `chrome.storage.local` for tokens

**Expected Results:**

- All tokens are removed from storage
- User data is cleared
- Extension shows unauthenticated state
- User must re-authenticate to use extension

**Coverage:** Requirements 6.6

### Test 7.2: PKCE Security Verification

#### Test 7.2.1: Mismatched Code Verifier Rejection

**Objective:** Verify that PKCE validation rejects mismatched code verifiers.

**Steps:**

1. Start OAuth flow and capture authorization code
2. Manually attempt token exchange with different code verifier
3. Use API testing tool (Postman/curl) to send request:
   ```bash
   curl -X POST http://localhost:3000/api/oauth/token \
     -H "Content-Type: application/json" \
     -d '{
       "grant_type": "authorization_code",
       "code": "<captured_code>",
       "redirect_uri": "https://<extension-id>.chromiumapp.org/oauth2",
       "code_verifier": "wrong_verifier_value",
       "client_id": "<extension-id>"
     }'
   ```

**Expected Results:**

- Backend returns 400 error
- Error message: "PKCE validation failed"
- No tokens are issued
- Authorization code is not consumed

**Coverage:** Requirements 2.5, 5.4

#### Test 7.2.2: Authorization Code Expiration (5 Minutes)

**Objective:** Verify that authorization codes expire after 5 minutes.

**Steps:**

1. Start OAuth flow and complete magic link verification
2. Capture authorization code from redirect URL
3. Wait 6 minutes
4. Attempt to exchange expired code for tokens

**Expected Results:**

- Backend returns 400 error
- Error message: "Authorization code has expired"
- No tokens are issued
- Expired code is deleted from database

**Coverage:** Requirements 5.5

#### Test 7.2.3: Authorization Code Single-Use

**Objective:** Verify that authorization codes can only be used once.

**Steps:**

1. Complete OAuth flow successfully
2. Capture authorization code used in token exchange
3. Attempt to exchange same code again

**Expected Results:**

- First exchange succeeds and returns tokens
- Second exchange fails with 400 error
- Error message: "Invalid authorization code"
- Code is deleted after first use

**Coverage:** Requirements 5.5

#### Test 7.2.4: Redirect URI Validation

**Objective:** Verify that redirect URI validation works correctly.

**Steps:**

1. Attempt to create authorization with invalid redirect URI:

   ```bash
   # Wrong domain
   curl -X POST http://localhost:3000/api/oauth/authorize \
     -H "Content-Type: application/json" \
     -H "Cookie: <session_cookie>" \
     -d '{
       "response_type": "code",
       "client_id": "<extension-id>",
       "redirect_uri": "https://evil.com/oauth2",
       "code_challenge": "<valid_challenge>",
       "code_challenge_method": "S256",
       "state": "test-state"
     }'
   ```

2. Attempt with mismatched extension ID in URI
3. Attempt with non-HTTPS URI
4. Attempt with valid URI format

**Expected Results:**

- Invalid URIs are rejected with 400 error
- Valid URI is accepted
- Error message describes validation failure

**Coverage:** Requirements 1.3, 5.6

## Test Results Summary

### Automated Tests

- **Total Tests:** 29
- **Passing:** 29
- **Failing:** 0
- **Coverage:** PKCE utilities, OAuth service, redirect URI validation

### Manual Tests Required

- **Test 7.1.1:** Login Flow (Registration) - ⏳ Pending
- **Test 7.1.2:** Login Flow (Existing User) - ⏳ Pending
- **Test 7.1.3:** OAuth Cancellation - ⏳ Pending
- **Test 7.1.4:** Network Error - ⏳ Pending
- **Test 7.1.5:** Invalid Code - ⏳ Pending
- **Test 7.1.6:** Token Refresh - ⏳ Pending
- **Test 7.1.7:** Logout - ⏳ Pending
- **Test 7.2.1:** PKCE Mismatch - ⏳ Pending
- **Test 7.2.2:** Code Expiration - ⏳ Pending
- **Test 7.2.3:** Single-Use Code - ⏳ Pending
- **Test 7.2.4:** Redirect URI Validation - ⏳ Pending

## Notes

- All automated tests pass successfully
- Manual tests require running backend, web app, and extension
- PKCE security is validated through both automated and manual tests
- Token refresh and logout functionality require manual verification
- Error scenarios are covered in both test types

## Troubleshooting

### Common Issues

**Extension not loading:**

- Ensure extension is built: `pnpm build`
- Check for TypeScript errors: `pnpm typecheck`
- Reload extension in `chrome://extensions/`

**OAuth window not opening:**

- Check extension permissions in manifest.json
- Verify `identity` permission is present
- Check console for errors

**Token exchange failing:**

- Verify backend is running
- Check API URL in extension config
- Verify database migrations are applied
- Check backend logs for errors

**PKCE validation failing:**

- Ensure code verifier and challenge are generated correctly
- Verify SHA-256 hashing is working
- Check Base64-URL encoding

### Debug Commands

**Check extension storage:**

```javascript
chrome.storage.local.get(null, (data) => console.log(data));
```

**Clear extension storage:**

```javascript
chrome.storage.local.clear(() => console.log("Storage cleared"));
```

**Check backend database:**

```sql
-- Check authorization codes
SELECT * FROM oauth_authorization_codes;

-- Check users
SELECT id, email, name FROM users;
```

**Monitor backend logs:**

```bash
cd apps/api
pnpm dev
# Watch console output for OAuth-related logs
```
