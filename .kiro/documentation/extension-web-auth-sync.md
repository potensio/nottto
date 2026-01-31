# Extension to Web Authentication Sync

## Overview

When users authenticate through the browser extension using the 6-digit code flow, they are automatically logged in on the web app via a magic link redirect. This provides a seamless experience where users authenticate once and are logged in everywhere.

## How It Works

### 1. Extension Authentication

- User enters email in extension auth prompt
- System sends 6-digit verification code to email
- User enters code in extension
- Extension calls `/api/auth/verify-code` endpoint
- API returns:
  - Access token & refresh token (for extension)
  - User data
  - Magic link URL (for web app login)

### 2. Token Storage in Extension

Tokens are stored in Chrome's local storage:

```javascript
{
  notto_access_token: "...",
  notto_refresh_token: "...",
  notto_user: { id, email, name, ... }
}
```

### 3. Web App Login via Magic Link

After successful verification:

1. Extension opens magic link URL in new tab: `${WEB_URL}/auth/verify?token=...`
2. Web app's verify page validates the magic link token
3. Web app stores tokens in localStorage
4. User is redirected to dashboard
5. User is now logged in on both extension and web app

### 4. Extension Ready

- Extension closes auth prompt
- Extension reloads the current page
- User can start annotating immediately

## Testing the Flow

### Prerequisites

- Extension built and loaded in Chrome
- API server running on `http://localhost:3001`
- Web app running on `http://localhost:3000`

### Test Steps

1. Open any webpage
2. Click the Notto extension icon
3. Click "Start Annotating" (should show auth prompt)
4. Enter your email address
5. Check email for 6-digit code
6. Enter the code in extension
7. Extension shows "You're all set!" message
8. **New tab opens automatically** with web app
9. Web app logs you in and redirects to dashboard
10. Extension reloads and is ready to use

### Expected Behavior

- ✅ Extension authenticated and ready
- ✅ New tab opens with web app
- ✅ Web app automatically logs in
- ✅ User sees dashboard (not login page)
- ✅ Both extension and web app show same user

## Advantages of This Approach

1. **Simple & Reliable**: No iframe, no postMessage, no cross-origin issues
2. **User-Friendly**: Clear visual feedback (new tab opens)
3. **Works Everywhere**: No CSP or X-Frame-Options blocking
4. **Secure**: Uses existing magic link infrastructure
5. **Consistent**: Same login mechanism as email magic links

## Security Considerations

1. **Magic Link Token**: Generated server-side, stored hashed in database
2. **Single Use**: Token is marked as used after first verification
3. **Time-Limited**: Token expires after 15 minutes
4. **HTTPS Only**: Production uses HTTPS for all communication
5. **No Token Exposure**: Token only in URL, not in postMessage or localStorage until verified

## Troubleshooting

### New tab doesn't open

- Check if popup blocker is enabled
- Verify `data.magicLinkUrl` is returned from API
- Check browser console for errors

### Web app shows login page instead of dashboard

- Verify magic link token is valid (not expired)
- Check API logs for token verification errors
- Ensure `/auth/verify` page is working correctly

### Extension authenticated but web app not

- Check if new tab actually opened
- Verify magic link URL is correct
- Check web app console for errors during verification

### "Invalid or expired link" error

- Token may have expired (15 min limit)
- Token may have been used already
- Request new code and try again
