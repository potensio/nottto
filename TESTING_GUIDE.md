# HTTP-Only Cookie Testing Guide

## 🚀 Quick Start

### 1. Start the API Server

```bash
cd apps/api
npm run dev
```

### 2. Start the Web App

```bash
cd apps/web
npm run dev
```

### 3. Open Browser

Visit: http://localhost:3000

---

## ✅ Test Scenarios

### Test 1: Magic Link Login (Web App)

**Steps:**

1. Go to http://localhost:3000/auth
2. Enter your email address
3. Click "Send magic link"
4. Check your email for the magic link
5. Click the magic link
6. You should be redirected to /dashboard

**Verify:**

- Open DevTools > Application > Cookies
- You should see a `session` cookie with:

  - HttpOnly: ✓
  - Secure: ✗ (in development)
  - SameSite: Lax
  - Path: /
  - Expires: 30 days from now

- Open DevTools > Application > Local Storage
- You should NOT see `accessToken` or `refreshToken`

**Expected Result:** ✅ Logged in successfully with session cookie

---

### Test 2: API Calls with Cookie

**Steps:**

1. After logging in (Test 1)
2. Open DevTools > Network tab
3. Navigate to http://localhost:3000/dashboard
4. Look at any API request (e.g., `/api/workspaces`)

**Verify:**

- Request Headers should include:
  ```
  Cookie: session=<long-random-string>
  ```
- Request Headers should NOT include:
  ```
  Authorization: Bearer xxx
  ```

**Expected Result:** ✅ API calls use cookies, not Bearer tokens

---

### Test 3: Session Persistence

**Steps:**

1. Login to web app (Test 1)
2. Close the browser tab
3. Open a new tab
4. Go to http://localhost:3000/dashboard

**Verify:**

- You should still be logged in
- No login prompt should appear

**Expected Result:** ✅ Session persists across browser sessions

---

### Test 4: Logout

**Steps:**

1. Login to web app (Test 1)
2. Click on your profile/account menu
3. Click "Logout"

**Verify:**

- You should be redirected to /auth
- Open DevTools > Application > Cookies
- The `session` cookie should be deleted

**Expected Result:** ✅ Logout clears session cookie

---

### Test 5: Protected Route Redirect

**Steps:**

1. Make sure you're logged out
2. Clear all cookies (DevTools > Application > Cookies > Clear all)
3. Try to visit http://localhost:3000/dashboard directly

**Verify:**

- You should be redirected to /auth
- URL should be: http://localhost:3000/auth

**Expected Result:** ✅ Unauthenticated users redirected to login

---

### Test 6: Extension Auth Flow (If Extension is Set Up)

**Steps:**

1. Make sure extension is installed
2. Click the extension icon
3. Click "Sign in with Email"
4. Web app should open with magic link flow
5. Complete the magic link verification
6. Extension should receive tokens

**Verify:**

- Extension background console should show: "Extension auth session completed successfully"
- Extension should be able to make API calls
- Extension uses Bearer tokens (not cookies)

**Expected Result:** ✅ Extension auth flow works independently

---

## 🔍 Debugging Tips

### Check Session Cookie

```javascript
// In browser console
document.cookie;
// Should show: session=xxx; (but you can't access the value due to HttpOnly)
```

### Check API Response Headers

```bash
# Login and get session cookie
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -v

# Look for Set-Cookie header in response
```

### Test API with Cookie

```bash
# First, get the session cookie from browser DevTools
# Then test API call:
curl http://localhost:3001/api/auth/me \
  -H "Cookie: session=YOUR_SESSION_TOKEN_HERE" \
  -v
```

### Test API with Bearer Token (Extension)

```bash
# Get token from extension or API response
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -v
```

---

## 🐛 Common Issues

### Issue: "Unauthorized" on API calls

**Possible Causes:**

1. Session cookie not being sent
2. CORS not configured correctly
3. Session expired

**Solutions:**

1. Check that `credentials: 'include'` is in fetch options
2. Verify CORS allows credentials: `credentials: true`
3. Check cookie expiration in DevTools

---

### Issue: Cookie not being set

**Possible Causes:**

1. CORS origin mismatch
2. Secure flag in development
3. SameSite restrictions

**Solutions:**

1. Verify API_URL matches CORS origin
2. Check cookie settings in auth routes
3. Use same domain for API and web app in production

---

### Issue: Extension can't authenticate

**Possible Causes:**

1. Extension auth session not completing
2. Bearer token not being sent
3. CORS blocking extension requests

**Solutions:**

1. Check extension background console for errors
2. Verify Authorization header is being sent
3. Ensure CORS allows chrome-extension:// origins

---

## 📊 Expected Behavior Summary

| Client    | Auth Method    | Storage              | API Header                  |
| --------- | -------------- | -------------------- | --------------------------- |
| Web App   | Session Cookie | Browser Cookie       | `Cookie: session=xxx`       |
| Extension | JWT Token      | chrome.storage.local | `Authorization: Bearer xxx` |

---

## 🎯 Success Criteria

- ✅ Web app uses HTTP-only cookies
- ✅ No tokens in localStorage
- ✅ Sessions persist across browser sessions
- ✅ Logout clears session cookie
- ✅ Extension continues using Bearer tokens
- ✅ Both auth methods work with same API
- ✅ No CORS errors
- ✅ No TypeScript errors
- ✅ No console errors

---

## 📝 Notes

- In development, cookies are not Secure (HTTP allowed)
- In production, cookies will be Secure (HTTPS only)
- Session expiry is 30 days
- Extension tokens have their own expiry (30 days from JWT)
- Both auth methods are validated by the same middleware
