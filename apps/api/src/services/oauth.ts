/**
 * OAuth 2.0 service with PKCE support for Chrome extension authentication
 */

import { eq, and, lt } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { nanoid } from "nanoid";
import { db } from "../db";
import { oauthAuthorizationCodes, users } from "@notto/shared/db";
import { validatePKCE } from "../utils/pkce";
import { generateTokens } from "../utils/auth";

// Authorization code expires in 5 minutes
const AUTHORIZATION_CODE_EXPIRY_MS = 5 * 60 * 1000;

// Allowed redirect URI pattern for Chrome extensions
const REDIRECT_URI_PATTERN = /^https:\/\/[a-z]{32}\.chromiumapp\.org\/.*$/;

/**
 * Creates an authorization code for OAuth flow
 * @param userId - User ID who is authorizing
 * @param codeChallenge - PKCE code challenge (Base64-URL encoded SHA-256 hash)
 * @param redirectUri - OAuth redirect URI
 * @param clientId - Extension ID
 * @param state - CSRF state parameter
 * @returns Authorization code
 */
export async function createAuthorizationCode(
  userId: string,
  codeChallenge: string,
  redirectUri: string,
  clientId: string,
  state: string,
): Promise<string> {
  // Validate redirect URI format
  if (!validateRedirectUri(redirectUri, clientId)) {
    console.error("OAuth Service: Invalid redirect URI", {
      redirectUri,
      clientId,
      timestamp: new Date().toISOString(),
    });
    throw new HTTPException(400, {
      message: JSON.stringify({
        error: "invalid_request",
        error_description:
          "Invalid redirect URI format. Must match https://<extension-id>.chromiumapp.org/*",
      }),
    });
  }

  // Generate authorization code
  const code = nanoid(32);
  const expiresAt = new Date(Date.now() + AUTHORIZATION_CODE_EXPIRY_MS);

  // Store authorization code
  await db.insert(oauthAuthorizationCodes).values({
    id: code,
    userId,
    codeChallenge,
    redirectUri,
    clientId,
    state,
    expiresAt,
  });

  console.log("OAuth Service: Authorization code created", {
    userId,
    clientId,
    expiresAt: expiresAt.toISOString(),
    timestamp: new Date().toISOString(),
  });

  return code;
}

/**
 * Exchanges authorization code for access and refresh tokens
 * @param code - Authorization code
 * @param codeVerifier - PKCE code verifier
 * @param redirectUri - OAuth redirect URI (must match original)
 * @param clientId - Extension ID (must match original)
 * @returns Access and refresh tokens with user data
 */
export async function exchangeAuthorizationCode(
  code: string,
  codeVerifier: string,
  redirectUri: string,
  clientId: string,
): Promise<{
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string | null };
}> {
  console.log("OAuth Service: Exchanging authorization code", {
    codeLength: code.length,
    verifierLength: codeVerifier.length,
    clientId,
    timestamp: new Date().toISOString(),
  });

  // Find authorization code
  const [authCode] = await db
    .select()
    .from(oauthAuthorizationCodes)
    .where(eq(oauthAuthorizationCodes.id, code))
    .limit(1);

  if (!authCode) {
    console.error("OAuth Service: Authorization code not found", {
      codeLength: code.length,
      clientId,
      timestamp: new Date().toISOString(),
    });
    throw new HTTPException(400, {
      message: JSON.stringify({
        error: "invalid_grant",
        error_description: "Invalid authorization code",
      }),
    });
  }

  // Check if expired
  if (new Date() > authCode.expiresAt) {
    console.error("OAuth Service: Authorization code expired", {
      code,
      expiresAt: authCode.expiresAt.toISOString(),
      now: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    });

    // Clean up expired code
    await db
      .delete(oauthAuthorizationCodes)
      .where(eq(oauthAuthorizationCodes.id, code));

    throw new HTTPException(400, {
      message: JSON.stringify({
        error: "invalid_grant",
        error_description: "Authorization code has expired",
      }),
    });
  }

  // Validate redirect URI matches
  if (authCode.redirectUri !== redirectUri) {
    console.error("OAuth Service: Redirect URI mismatch", {
      expected: authCode.redirectUri,
      received: redirectUri,
      timestamp: new Date().toISOString(),
    });
    throw new HTTPException(400, {
      message: JSON.stringify({
        error: "invalid_request",
        error_description: "Redirect URI does not match the original request",
      }),
    });
  }

  // Validate client ID matches
  if (authCode.clientId !== clientId) {
    console.error("OAuth Service: Client ID mismatch", {
      expected: authCode.clientId,
      received: clientId,
      timestamp: new Date().toISOString(),
    });
    throw new HTTPException(400, {
      message: JSON.stringify({
        error: "invalid_client",
        error_description: "Client ID does not match the original request",
      }),
    });
  }

  // Validate PKCE
  console.log("OAuth Service: Validating PKCE", {
    verifierLength: codeVerifier.length,
    challengeLength: authCode.codeChallenge.length,
  });

  const isPKCEValid = await validatePKCE(codeVerifier, authCode.codeChallenge);
  if (!isPKCEValid) {
    console.error("OAuth Service: PKCE validation failed", {
      verifierLength: codeVerifier.length,
      challengeLength: authCode.codeChallenge.length,
      timestamp: new Date().toISOString(),
    });
    throw new HTTPException(400, {
      message: JSON.stringify({
        error: "invalid_grant",
        error_description:
          "PKCE validation failed. The code verifier does not match the code challenge.",
      }),
    });
  }

  console.log("OAuth Service: PKCE validation successful");

  // Get user details
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, authCode.userId))
    .limit(1);

  if (!user) {
    console.error("OAuth Service: User not found", {
      userId: authCode.userId,
      timestamp: new Date().toISOString(),
    });
    throw new HTTPException(400, {
      message: JSON.stringify({
        error: "invalid_grant",
        error_description: "User not found",
      }),
    });
  }

  // Delete authorization code (single-use only)
  await db
    .delete(oauthAuthorizationCodes)
    .where(eq(oauthAuthorizationCodes.id, code));

  console.log("OAuth Service: Authorization code deleted (single-use)");

  // Generate tokens
  const tokens = await generateTokens({
    sub: user.id,
    email: user.email,
  });

  console.log("OAuth Service: Tokens generated successfully", {
    userId: user.id,
    timestamp: new Date().toISOString(),
  });

  return {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

/**
 * Validates redirect URI format for Chrome extensions
 * @param uri - Redirect URI to validate
 * @param clientId - Extension ID
 * @returns True if valid
 */
export function validateRedirectUri(uri: string, clientId: string): boolean {
  // Check if URI matches the pattern
  if (!REDIRECT_URI_PATTERN.test(uri)) {
    return false;
  }

  // Extract extension ID from URI
  const match = uri.match(/^https:\/\/([a-z]{32})\.chromiumapp\.org\//);
  if (!match) {
    return false;
  }

  const extensionId = match[1];

  // Verify extension ID matches client ID
  return extensionId === clientId;
}

/**
 * Cleans up expired authorization codes
 * Should be called periodically by a cleanup job
 */
export async function cleanupExpiredAuthorizationCodes(): Promise<void> {
  await db
    .delete(oauthAuthorizationCodes)
    .where(lt(oauthAuthorizationCodes.expiresAt, new Date()));
}
