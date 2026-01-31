# Authentication Sync Test Checklist

## Pre-Test Setup

- [ ] API server running on `http://localhost:3001`
- [ ] Web app running on `http://localhost:3000`
- [ ] Extension built with latest changes (`npm run build` in `apps/extension`)
- [ ] Extension loaded/reloaded in Chrome (chrome://extensions → Reload)
- [ ] Browser console open to monitor logs

## Test 1: New User Registration via Extension

1. [ ] Open any webpage (e.g., google.com)
2. [ ] Click Notto extension icon
3. [ ] Click "Start Annotating" button
4. [ ] Auth prompt appears with Login/Register toggle
5. [ ] Click "Register" tab
6. [ ] Enter full name
7. [ ] Enter email address
8. [ ] Click "Continue"
9. [ ] Prompt shows "Check your email" with 6-digit code inputs
10. [ ] Check email for verification code
11. [ ] Enter 6-digit code (can paste or type)
12. [ ] "Verify Code" button becomes enabled
13. [ ] Click "Verify Code"
14. [ ] Shows "You're all set!" success message
15. [ ] Extension reloads after 1.5 seconds
16. [ ] Extension is ready to use (no auth prompt)

**Web App Sync Check:** 17. [ ] Open new tab to `http://localhost:3000` 18. [ ] Should automatically redirect to `/dashboard` 19. [ ] User is logged in (see user avatar/name in header) 20. [ ] Can access all authenticated features

**Console Checks:**

- [ ] Extension console shows "Auth synced from extension"
- [ ] Web app console shows "Auth synced from extension"
- [ ] No errors in either console

**Storage Checks:**

- [ ] Extension storage has `notto_access_token`, `notto_refresh_token`, `notto_user`
- [ ] Web app localStorage has `accessToken`, `refreshToken`

## Test 2: Existing User Login via Extension

1. [ ] Clear extension storage (chrome://extensions → Notto → Details → Clear storage)
2. [ ] Reload extension
3. [ ] Open any webpage
4. [ ] Click Notto extension icon
5. [ ] Click "Start Annotating"
6. [ ] Auth prompt appears with "Login" selected
7. [ ] Enter email address (same as Test 1)
8. [ ] Click "Continue"
9. [ ] Check email for new verification code
10. [ ] Enter 6-digit code
11. [ ] Click "Verify Code"
12. [ ] Shows success message
13. [ ] Extension reloads and is ready

**Web App Sync Check:** 14. [ ] Open new tab to `http://localhost:3000` 15. [ ] Should be logged in automatically 16. [ ] Same user data as before

## Test 3: Web App Already Open

1. [ ] Open `http://localhost:3000` in Tab A (should be logged out)
2. [ ] Open any webpage in Tab B
3. [ ] Authenticate via extension in Tab B (follow Test 1 or 2)
4. [ ] Switch back to Tab A
5. [ ] Refresh Tab A
6. [ ] Should now be logged in

## Test 4: Multiple Browser Windows

1. [ ] Authenticate via extension
2. [ ] Open web app in Window 1 → logged in ✓
3. [ ] Open web app in Window 2 → logged in ✓
4. [ ] Both windows should show same user

## Test 5: Error Handling

**Invalid Email:**

1. [ ] Enter invalid email (no @)
2. [ ] Shows error: "Please enter a valid email address"

**Missing Name (Register):**

1. [ ] Click Register tab
2. [ ] Leave name empty
3. [ ] Enter email
4. [ ] Click Continue
5. [ ] Shows error: "Please enter your full name"

**Invalid Code:**

1. [ ] Request code successfully
2. [ ] Enter wrong 6-digit code
3. [ ] Click Verify
4. [ ] Shows error message
5. [ ] Can try again with correct code

**Expired Code:**

1. [ ] Request code
2. [ ] Wait 10+ minutes
3. [ ] Enter code
4. [ ] Shows error: "Code expired"
5. [ ] Click "Use different email" to go back
6. [ ] Request new code

## Test 6: Network Errors

**API Down:**

1. [ ] Stop API server
2. [ ] Try to request code
3. [ ] Shows error message
4. [ ] Start API server
5. [ ] Click "Try Again"
6. [ ] Should work

## Test 7: Sync Failure Scenarios

**Web App Not Running:**

1. [ ] Stop web app server
2. [ ] Authenticate via extension
3. [ ] Extension should still work (sync fails silently)
4. [ ] Start web app
5. [ ] Open web app → not logged in (expected)
6. [ ] Can log in via web app separately

**Iframe Blocked:**

1. [ ] Check browser console for CSP errors
2. [ ] If iframe blocked, authentication should still work in extension
3. [ ] Web app login required separately

## Success Criteria

✅ **Must Pass:**

- User can authenticate via extension
- Extension stores tokens correctly
- Extension works after authentication
- Web app receives tokens via sync
- Web app shows user as logged in
- No console errors during happy path

⚠️ **Should Pass:**

- Sync works even if web app opened before auth
- Multiple tabs/windows all show logged in
- Error messages are clear and helpful

🔧 **Nice to Have:**

- Sync works across different domains (production)
- Graceful fallback if sync fails
- User notified if sync fails

## Known Issues / Limitations

1. **Iframe may be blocked by CSP**: Some websites may block the sync iframe. This is expected and doesn't break extension functionality.

2. **Sync requires web app to be accessible**: If web app is down or unreachable, sync will fail silently. Extension still works.

3. **No sync confirmation to user**: User doesn't see explicit message that web app is synced. They discover it when they open the web app.

4. **Token expiration**: If user authenticates in extension but doesn't open web app for a long time, tokens may expire. They'll need to log in again on web app.

## Debugging Tips

**Extension not showing auth prompt:**

- Check if tokens already exist in storage
- Clear storage and reload extension

**Code not arriving:**

- Check API logs for email sending
- Verify EMAIL_MODE in .env
- Check spam folder
- Verify BREVO_API_KEY is valid

**Sync not working:**

- Open browser DevTools → Network tab
- Look for request to `/auth/sync`
- Check if iframe loaded successfully
- Look for postMessage in console
- Verify localStorage has tokens

**Web app not recognizing tokens:**

- Check localStorage has `accessToken` and `refreshToken`
- Verify tokens are valid (not expired)
- Check `/api/auth/me` response in Network tab
- Verify Authorization header is sent

**CORS errors:**

- Verify API has correct CORS configuration
- Check if credentials are included in requests
- Verify API_URL matches actual API server
