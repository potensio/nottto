/**
 * OAuth 2.0 routes with PKCE support for Chrome extension authentication
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import { authMiddleware } from "../middleware/auth";
import * as oauthService from "../services/oauth";
import { eq, and, gte } from "drizzle-orm";
import { db } from "../db";
import { rateLimitRecords } from "@notto/shared/db";

export const oauthRoutes = new Hono();

// Rate limiting configuration
const AUTHORIZE_LIMIT = 10; // 10 requests per minute
const TOKEN_LIMIT = 5; // 5 requests per minute
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// OAuth authorization request schema
const oauthAuthorizeSchema = z.object({
  response_type: z.literal("code"),
  client_id: z.string().min(1, "Client ID is required"),
  redirect_uri: z.string().url("Invalid redirect URI"),
  code_challenge: z.string().min(1, "Code challenge is required"),
  code_challenge_method: z.literal("S256"),
  state: z.string().min(1, "State parameter is required"),
});

// OAuth token exchange request schema
const oauthTokenSchema = z.object({
  grant_type: z.literal("authorization_code"),
  code: z.string().min(1, "Authorization code is required"),
  redirect_uri: z.string().url("Invalid redirect URI"),
  code_verifier: z.string().min(1, "Code verifier is required"),
  client_id: z.string().min(1, "Client ID is required"),
});

/**
 * Rate limiting middleware for OAuth endpoints
 */
async function rateLimitMiddleware(
  identifier: string,
  action: string,
  limit: number,
) {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  // Count requests in the current window
  const requests = await db
    .select()
    .from(rateLimitRecords)
    .where(
      and(
        eq(rateLimitRecords.identifier, identifier),
        eq(rateLimitRecords.action, action),
        gte(rateLimitRecords.createdAt, windowStart),
      ),
    );

  if (requests.length >= limit) {
    throw new HTTPException(429, {
      message: "Rate limit exceeded. Please try again later.",
    });
  }

  // Record this request
  await db.insert(rateLimitRecords).values({
    identifier,
    action,
  });
}

/**
 * POST /oauth/authorize
 * Generates an authorization code for the authenticated user
 * Requires authentication via session cookie
 */
oauthRoutes.post(
  "/authorize",
  authMiddleware,
  zValidator("json", oauthAuthorizeSchema),
  async (c) => {
    const userId = c.get("userId");
    const {
      client_id,
      redirect_uri,
      code_challenge,
      code_challenge_method,
      state,
    } = c.req.valid("json");

    try {
      console.log("OAuth Authorize: Request received", {
        userId,
        clientId: client_id,
        redirectUri: redirect_uri,
        timestamp: new Date().toISOString(),
      });

      // Rate limiting
      await rateLimitMiddleware(client_id, "oauth_authorize", AUTHORIZE_LIMIT);

      // Create authorization code
      const code = await oauthService.createAuthorizationCode(
        userId,
        code_challenge,
        redirect_uri,
        client_id,
        state,
      );

      console.log("OAuth Authorize: Authorization code created", {
        userId,
        clientId: client_id,
        codeLength: code.length,
        timestamp: new Date().toISOString(),
      });

      return c.json({
        code,
        state,
      });
    } catch (error) {
      console.error("OAuth Authorize: Failed", {
        userId,
        clientId: client_id,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  },
);

/**
 * POST /oauth/token
 * Exchanges authorization code for access and refresh tokens
 * No authentication required - validated via PKCE
 */
oauthRoutes.post("/token", zValidator("json", oauthTokenSchema), async (c) => {
  const { code, code_verifier, redirect_uri, client_id } = c.req.valid("json");

  try {
    console.log("OAuth Token: Exchange request received", {
      clientId: client_id,
      codeLength: code.length,
      verifierLength: code_verifier.length,
      timestamp: new Date().toISOString(),
    });

    // Rate limiting
    await rateLimitMiddleware(client_id, "oauth_token", TOKEN_LIMIT);

    // Exchange code for tokens
    const tokens = await oauthService.exchangeAuthorizationCode(
      code,
      code_verifier,
      redirect_uri,
      client_id,
    );

    console.log("OAuth Token: Token exchange successful", {
      clientId: client_id,
      userId: tokens.user?.id,
      timestamp: new Date().toISOString(),
    });

    return c.json({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_type: "Bearer",
      expires_in: 30 * 24 * 60 * 60, // 30 days in seconds
      user: tokens.user,
    });
  } catch (error) {
    console.error("OAuth Token: Exchange failed", {
      clientId: client_id,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
});
