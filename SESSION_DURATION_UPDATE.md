# Session Duration Update: 30 Days

## ✅ Changes Made

Updated both web app and extension authentication to use **30-day sessions** with **no refresh token needed**.

### Files Modified

1. **`apps/api/src/services/auth.ts`**

   - Changed `SESSION_EXPIRY_MS` from 7 days to 30 days
   - Web app session cookies now last 30 days

2. **`apps/api/src/routes/auth.ts`**

   - Updated cookie `maxAge` from 7 days to 30 days
   - Ensures cookie expiration matches session expiration

3. **`apps/api/src/utils/auth.ts`**

   - Changed `ACCESS_TOKEN_EXPIRY` from 1 hour to 30 days
   - Extension JWT tokens now last 30 days
   - No token refresh needed for 30 days

4. **Documentation Updates**
   - Updated `MIGRATION_SUMMARY.md` to reflect 30-day duration
   - Updated `TESTING_GUIDE.md` to reflect 30-day duration

---

## 🎯 What This Means

### Web App (HTTP-Only Cookies)

- ✅ Users stay logged in for **30 days**
- ✅ No refresh token logic needed
- ✅ Session automatically expires after 30 days
- ✅ Users can close browser and come back anytime within 30 days

### Extension (JWT Tokens)

- ✅ Extension users stay logged in for **30 days**
- ✅ No token refresh needed for 30 days
- ✅ Tokens stored securely in `chrome.storage.local`
- ✅ Automatic refresh fallback if token expires (rare)

---

## 🔒 Security Considerations

### Is 30 Days Safe?

**Yes, for this use case:**

1. **HTTP-Only Cookies (Web App)**

   - Cookies are not accessible via JavaScript (XSS protection)
   - SameSite=Lax prevents CSRF attacks
   - Secure flag in production (HTTPS only)
   - Users can manually logout anytime

2. **JWT Tokens (Extension)**

   - Stored in `chrome.storage.local` (isolated from web pages)
   - Not accessible to websites or other extensions
   - Extension sandbox provides additional security
   - Users can manually logout anytime

3. **Industry Standards**
   - Many apps use 30-day sessions (GitHub, Gmail, etc.)
   - "Remember me" functionality is common
   - Balance between security and user experience

### When to Use Shorter Sessions

Consider shorter sessions (7 days or less) if:

- Handling sensitive financial data
- Compliance requirements (HIPAA, PCI-DSS)
- Shared computer environments
- High-security applications

For a bug reporting tool, 30 days is appropriate and user-friendly.

---

## 🧪 Testing

### Verify Web App Session Duration

1. Login to web app
2. Open DevTools > Application > Cookies
3. Find the `session` cookie
4. Check the "Expires / Max-Age" column
5. Should show a date 30 days in the future

### Verify Extension Token Duration

1. Login to extension
2. Open extension background console
3. Check stored token:
   ```javascript
   chrome.storage.local.get(["nottto_access_token"], (result) => {
     const token = result.nottto_access_token;
     const payload = JSON.parse(atob(token.split(".")[1]));
     const expiryDate = new Date(payload.exp * 1000);
     console.log("Token expires:", expiryDate);
   });
   ```
4. Should show a date 30 days in the future

---

## 📊 Comparison

| Aspect              | Before                      | After                 |
| ------------------- | --------------------------- | --------------------- |
| **Web App Session** | 7 days                      | 30 days               |
| **Extension Token** | 1 hour (with refresh)       | 30 days (no refresh)  |
| **Refresh Logic**   | Required every hour         | Not needed            |
| **User Experience** | Frequent re-auth            | Stay logged in longer |
| **API Calls**       | Refresh endpoint used often | Rarely used           |

---

## 🚀 Deployment

No special deployment steps needed:

1. **Existing Users**

   - Old sessions/tokens will expire naturally
   - New logins will get 30-day sessions
   - No forced logout required

2. **Database**

   - No migration needed
   - Session expiry is stored per-session
   - New sessions automatically use 30-day expiry

3. **Environment Variables**
   - No changes needed
   - All configuration is in code

---

## 🔄 Rollback (If Needed)

To revert to shorter sessions:

1. **Web App (7 days):**

   ```typescript
   // apps/api/src/services/auth.ts
   const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

   // apps/api/src/routes/auth.ts
   maxAge: 60 * 60 * 24 * 7, // 7 days
   ```

2. **Extension (1 hour with refresh):**

   ```typescript
   // apps/api/src/utils/auth.ts
   const ACCESS_TOKEN_EXPIRY = "1h"; // 1 hour
   ```

3. Redeploy API
4. Users will get shorter sessions on next login

---

## 💡 Future Enhancements

### Optional: Configurable Session Duration

Could add user preference for session duration:

```typescript
// User settings
interface UserPreferences {
  sessionDuration: "7d" | "30d" | "90d";
}

// Create session with user preference
const expiryMs = getSessionDuration(user.preferences.sessionDuration);
```

### Optional: "Remember Me" Checkbox

Could offer choice at login:

```typescript
// Login form
<input type="checkbox" name="rememberMe" />

// API
if (rememberMe) {
  sessionExpiry = 30 days;
} else {
  sessionExpiry = 7 days;
}
```

### Optional: Session Activity Tracking

Could extend session on activity:

```typescript
// On each API call
if (session.lastActiveAt < 24 hours ago) {
  // Extend session by 30 days
  session.expiresAt = now + 30 days;
}
```

---

## ✅ Summary

- ✅ Web app sessions now last 30 days
- ✅ Extension tokens now last 30 days
- ✅ No refresh token logic needed
- ✅ Better user experience (stay logged in longer)
- ✅ Still secure (HTTP-only cookies, isolated storage)
- ✅ No breaking changes
- ✅ No migration required
- ✅ Easy to rollback if needed

Users will appreciate not having to re-authenticate frequently while maintaining strong security through HTTP-only cookies and proper token storage.
