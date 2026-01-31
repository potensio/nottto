# PKCE Security Verification Tests

This document provides detailed manual testing procedures to verify PKCE (Proof Key for Code Exchange) security implementation.

## Overview

PKCE is a security extension to OAuth 2.0 that protects against authorization code interception attacks. These tests verify that:

1. Mismatched code verifiers are rejected
2. Authorization codes expire after 5 minutes
3. Authorization codes can only be used once
4. Redirect URI validation works correctly

## Prerequisites

- Backend API running (`cd apps/api && pnpm dev`)
- Database accessible
- API testing tool (curl, Postman, or similar)
- Valid user account for testing

## Test 1: Mismatched Code Verifier Rejection

**Requirement:** 2.5, 5.4

**Objective:** Verify that the backend rejects token exchange requests when the code verifier doesn't match the code challenge.

### Setup

1. Generate a valid code verifier and challenge:

   ```javascript
   // Run in browser console or Node.js
   async function generatePKCE() {
     // Generate code verifier (32 bytes random)
     const randomBytes = new Uint8Array(32);
     crypto.getRandomValues(randomBytes);
     const verifier = btoa(String.fromCharCode(...randomBytes))
       .replace(/\+/g, "-")
       .replace(/\//g, "_")
       .replace(/=/g, "");

     // Generate code challenge (SHA-256 of verifier)
     const encoder = new TextEncoder();
     const data = encoder.encode(verifier);
     const hashBuffer = await crypto.subtle.digest("SHA-256", data);
     const hashArray = new Uint8Array(hashBuffer);
     const challenge = btoa(String.fromCharCode(...hashArray))
       .replace(/\+/g, "-")
       .replace(/\//g, "_")
       .replace(/=/g, "");

     return { verifier, challenge };
   }

   generatePKCE().then(console.log);
   ```

2. Save the verifier and challenge values

### Test Steps

1. **Create authorization code with valid challenge:**

   ```bash
   # Replace <SESSION_COOKIE> with valid session cookie from authenticated user
   # Replace <EXTENSION_ID> with your extension ID (32 lowercase letters)
   # Replace <CODE_CHALLENGE> with generated challenge

   curl -X POST http://localhost:3000/api/oauth/authorize \
     -H "Content-Type: application/json" \
     -H "Cookie: session=<SESSION_COOKIE>" \
     -d '{
       "response_type": "code",
       "client_id": "<EXTENSION_ID>",
       "redirect_uri": "https://<EXTENSION_ID>.chromiumapp.org/oauth2",
       "code_challenge": "<CODE_CHALLENGE>",
       "code_challenge_method": "S256",
       "state": "test-state-123"
     }'
   ```

2. **Save the returned authorization code**

3. **Attempt token exchange with WRONG verifier:**
   ```bash
   # Use a different verifier than the one used to generate the challenge
   curl -X POST http://localhost:3000/api/oauth/token \
     -H "Content-Type: application/json" \
     -d '{
       "grant_type": "authorization_code",
       "code": "<AUTHORIZATION_CODE>",
       "redirect_uri": "https://<EXTENSION_ID>.chromiumapp.org/oauth2",
       "code_verifier": "wrong_verifier_that_does_not_match",
       "client_id": "<EXTENSION_ID>"
     }'
   ```

### Expected Results

- ❌ Request should fail with HTTP 400
- ❌ Response should contain:
  ```json
  {
    "error": "invalid_grant",
    "error_description": "PKCE validation failed. The code verifier does not match the code challenge."
  }
  ```
- ❌ No tokens should be issued
- ✅ Authorization code should remain valid (not consumed)

### Verification

```bash
# Check backend logs for PKCE validation failure
# Should see: "OAuth Service: PKCE validation failed"
```

---

## Test 2: Authorization Code Expiration (5 Minutes)

**Requirement:** 5.5

**Objective:** Verify that authorization codes expire after 5 minutes and cannot be used after expiration.

### Test Steps

1. **Create authorization code:**

   ```bash
   curl -X POST http://localhost:3000/api/oauth/authorize \
     -H "Content-Type: application/json" \
     -H "Cookie: session=<SESSION_COOKIE>" \
     -d '{
       "response_type": "code",
       "client_id": "<EXTENSION_ID>",
       "redirect_uri": "https://<EXTENSION_ID>.chromiumapp.org/oauth2",
       "code_challenge": "<CODE_CHALLENGE>",
       "code_challenge_method": "S256",
       "state": "test-state-123"
     }'
   ```

2. **Note the current time and save the authorization code**

3. **Wait 6 minutes** (to ensure expiration)

4. **Attempt to exchange expired code:**
   ```bash
   curl -X POST http://localhost:3000/api/oauth/token \
     -H "Content-Type: application/json" \
     -d '{
       "grant_type": "authorization_code",
       "code": "<AUTHORIZATION_CODE>",
       "redirect_uri": "https://<EXTENSION_ID>.chromiumapp.org/oauth2",
       "code_verifier": "<CORRECT_VERIFIER>",
       "client_id": "<EXTENSION_ID>"
     }'
   ```

### Expected Results

- ❌ Request should fail with HTTP 400
- ❌ Response should contain:
  ```json
  {
    "error": "invalid_grant",
    "error_description": "Authorization code has expired"
  }
  ```
- ❌ No tokens should be issued
- ✅ Expired code should be deleted from database

### Verification

```sql
-- Check that expired code is deleted
SELECT * FROM oauth_authorization_codes WHERE id = '<AUTHORIZATION_CODE>';
-- Should return 0 rows
```

### Alternative: Manual Expiration Test

If you don't want to wait 6 minutes, you can manually expire a code:

```sql
-- Create a code, then immediately expire it
UPDATE oauth_authorization_codes
SET expires_at = NOW() - INTERVAL '1 minute'
WHERE id = '<AUTHORIZATION_CODE>';
```

Then attempt token exchange immediately.

---

## Test 3: Authorization Code Single-Use

**Requirement:** 5.5

**Objective:** Verify that authorization codes can only be used once and are deleted after successful exchange.

### Test Steps

1. **Create authorization code:**

   ```bash
   curl -X POST http://localhost:3000/api/oauth/authorize \
     -H "Content-Type: application/json" \
     -H "Cookie: session=<SESSION_COOKIE>" \
     -d '{
       "response_type": "code",
       "client_id": "<EXTENSION_ID>",
       "redirect_uri": "https://<EXTENSION_ID>.chromiumapp.org/oauth2",
       "code_challenge": "<CODE_CHALLENGE>",
       "code_challenge_method": "S256",
       "state": "test-state-123"
     }'
   ```

2. **First token exchange (should succeed):**

   ```bash
   curl -X POST http://localhost:3000/api/oauth/token \
     -H "Content-Type: application/json" \
     -d '{
       "grant_type": "authorization_code",
       "code": "<AUTHORIZATION_CODE>",
       "redirect_uri": "https://<EXTENSION_ID>.chromiumapp.org/oauth2",
       "code_verifier": "<CORRECT_VERIFIER>",
       "client_id": "<EXTENSION_ID>"
     }'
   ```

3. **Save the returned tokens**

4. **Second token exchange with same code (should fail):**
   ```bash
   # Use the SAME authorization code again
   curl -X POST http://localhost:3000/api/oauth/token \
     -H "Content-Type: application/json" \
     -d '{
       "grant_type": "authorization_code",
       "code": "<AUTHORIZATION_CODE>",
       "redirect_uri": "https://<EXTENSION_ID>.chromiumapp.org/oauth2",
       "code_verifier": "<CORRECT_VERIFIER>",
       "client_id": "<EXTENSION_ID>"
     }'
   ```

### Expected Results

**First Exchange:**

- ✅ Request should succeed with HTTP 200
- ✅ Response should contain access_token, refresh_token, and user data
- ✅ Authorization code should be deleted from database

**Second Exchange:**

- ❌ Request should fail with HTTP 400
- ❌ Response should contain:
  ```json
  {
    "error": "invalid_grant",
    "error_description": "Invalid authorization code"
  }
  ```
- ❌ No new tokens should be issued

### Verification

```sql
-- After first exchange, code should be deleted
SELECT * FROM oauth_authorization_codes WHERE id = '<AUTHORIZATION_CODE>';
-- Should return 0 rows
```

---

## Test 4: Redirect URI Validation

**Requirement:** 1.3, 5.6

**Objective:** Verify that redirect URI validation correctly accepts valid Chrome extension URIs and rejects invalid ones.

### Test 4.1: Valid Redirect URI

```bash
curl -X POST http://localhost:3000/api/oauth/authorize \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<SESSION_COOKIE>" \
  -d '{
    "response_type": "code",
    "client_id": "abcdefghijklmnopqrstuvwxyzabcdef",
    "redirect_uri": "https://abcdefghijklmnopqrstuvwxyzabcdef.chromiumapp.org/oauth2",
    "code_challenge": "<CODE_CHALLENGE>",
    "code_challenge_method": "S256",
    "state": "test-state-123"
  }'
```

**Expected:** ✅ Success (HTTP 200), authorization code returned

### Test 4.2: Invalid Domain

```bash
curl -X POST http://localhost:3000/api/oauth/authorize \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<SESSION_COOKIE>" \
  -d '{
    "response_type": "code",
    "client_id": "abcdefghijklmnopqrstuvwxyzabcdef",
    "redirect_uri": "https://evil.com/oauth2",
    "code_challenge": "<CODE_CHALLENGE>",
    "code_challenge_method": "S256",
    "state": "test-state-123"
  }'
```

**Expected:** ❌ Failure (HTTP 400), error: "invalid_request"

### Test 4.3: Non-HTTPS URI

```bash
curl -X POST http://localhost:3000/api/oauth/authorize \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<SESSION_COOKIE>" \
  -d '{
    "response_type": "code",
    "client_id": "abcdefghijklmnopqrstuvwxyzabcdef",
    "redirect_uri": "http://abcdefghijklmnopqrstuvwxyzabcdef.chromiumapp.org/oauth2",
    "code_challenge": "<CODE_CHALLENGE>",
    "code_challenge_method": "S256",
    "state": "test-state-123"
  }'
```

**Expected:** ❌ Failure (HTTP 400), error: "invalid_request"

### Test 4.4: Mismatched Extension ID

```bash
curl -X POST http://localhost:3000/api/oauth/authorize \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<SESSION_COOKIE>" \
  -d '{
    "response_type": "code",
    "client_id": "abcdefghijklmnopqrstuvwxyzabcdef",
    "redirect_uri": "https://zyxwvutsrqponmlkjihgfedcbazyxwvu.chromiumapp.org/oauth2",
    "code_challenge": "<CODE_CHALLENGE>",
    "code_challenge_method": "S256",
    "state": "test-state-123"
  }'
```

**Expected:** ❌ Failure (HTTP 400), error: "invalid_request"

### Test 4.5: Invalid Extension ID Format (uppercase)

```bash
curl -X POST http://localhost:3000/api/oauth/authorize \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<SESSION_COOKIE>" \
  -d '{
    "response_type": "code",
    "client_id": "ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEF",
    "redirect_uri": "https://ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEF.chromiumapp.org/oauth2",
    "code_challenge": "<CODE_CHALLENGE>",
    "code_challenge_method": "S256",
    "state": "test-state-123"
  }'
```

**Expected:** ❌ Failure (HTTP 400), error: "invalid_request"

### Test 4.6: Wrong Extension ID Length

```bash
curl -X POST http://localhost:3000/api/oauth/authorize \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<SESSION_COOKIE>" \
  -d '{
    "response_type": "code",
    "client_id": "shortid",
    "redirect_uri": "https://shortid.chromiumapp.org/oauth2",
    "code_challenge": "<CODE_CHALLENGE>",
    "code_challenge_method": "S256",
    "state": "test-state-123"
  }'
```

**Expected:** ❌ Failure (HTTP 400), error: "invalid_request"

---

## Test Results Checklist

### PKCE Security Tests

- [ ] Test 1: Mismatched code verifier is rejected
- [ ] Test 2: Authorization codes expire after 5 minutes
- [ ] Test 3: Authorization codes can only be used once
- [ ] Test 4.1: Valid redirect URI is accepted
- [ ] Test 4.2: Invalid domain is rejected
- [ ] Test 4.3: Non-HTTPS URI is rejected
- [ ] Test 4.4: Mismatched extension ID is rejected
- [ ] Test 4.5: Invalid extension ID format is rejected
- [ ] Test 4.6: Wrong extension ID length is rejected

### Security Properties Verified

- ✅ **PKCE Protection:** Code verifier must match code challenge (prevents interception attacks)
- ✅ **Time-Limited Codes:** Authorization codes expire after 5 minutes (limits attack window)
- ✅ **Single-Use Codes:** Authorization codes can only be used once (prevents replay attacks)
- ✅ **Redirect URI Validation:** Only valid Chrome extension URIs are accepted (prevents redirect attacks)

---

## Automated Test Coverage

The following PKCE security properties are already covered by automated tests in `apps/api/src/`:

### `utils/pkce.test.ts`

- ✅ PKCE round-trip validation (verifier → challenge → validation)
- ✅ Deterministic challenge generation
- ✅ Rejection of mismatched verifiers
- ✅ Base64-URL encoding correctness
- ✅ Challenge length validation

### `services/oauth.test.ts`

- ✅ Authorization code creation with PKCE challenge
- ✅ Token exchange with PKCE validation
- ✅ Rejection of mismatched verifiers
- ✅ Rejection of expired codes
- ✅ Single-use code enforcement
- ✅ Redirect URI format validation
- ✅ Extension ID validation

**Total Automated Tests:** 29 passing

---

## Notes

- All automated tests pass, providing strong confidence in PKCE implementation
- Manual tests verify end-to-end security in realistic scenarios
- PKCE provides protection even if authorization code is intercepted
- Redirect URI validation prevents malicious redirects
- Time-limited codes reduce attack window
- Single-use codes prevent replay attacks

## Troubleshooting

### Getting Session Cookie

1. Log in to web app in browser
2. Open DevTools → Application → Cookies
3. Find `session` cookie value
4. Use in curl commands: `-H "Cookie: session=<value>"`

### Generating Valid Extension ID

Chrome extension IDs are 32 lowercase letters (a-z):

```javascript
// Generate random valid extension ID
Array.from({ length: 32 }, () =>
  String.fromCharCode(97 + Math.floor(Math.random() * 26)),
).join("");
```

### Checking Database

```sql
-- View all authorization codes
SELECT id, user_id, client_id, expires_at, created_at
FROM oauth_authorization_codes
ORDER BY created_at DESC;

-- Check for expired codes
SELECT COUNT(*) FROM oauth_authorization_codes
WHERE expires_at < NOW();
```
