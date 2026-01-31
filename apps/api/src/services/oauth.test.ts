/**
 * OAuth service tests
 * Tests authorization code creation, token exchange, PKCE validation, and security properties
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  createAuthorizationCode,
  exchangeAuthorizationCode,
  validateRedirectUri,
  cleanupExpiredAuthorizationCodes,
} from "./oauth";
import { generateCodeChallenge } from "../utils/pkce";
import { db } from "../db";
import { oauthAuthorizationCodes, users } from "@notto/shared/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { randomUUID } from "crypto";

// Test data
let TEST_USER_ID: string;
const TEST_CLIENT_ID = "abcdefghijklmnopqrstuvwxyzabcdef"; // 32 lowercase chars (valid Chrome extension ID format)
const TEST_REDIRECT_URI = `https://${TEST_CLIENT_ID}.chromiumapp.org/oauth2`;
const TEST_CODE_VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const TEST_STATE = "test-state-123";

describe("OAuth Service", () => {
  // Create test user before tests
  beforeEach(async () => {
    TEST_USER_ID = randomUUID();
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: `test-${nanoid()}@example.com`,
      name: "Test User",
    });
  });

  // Clean up test data after tests
  afterEach(async () => {
    await db
      .delete(oauthAuthorizationCodes)
      .where(eq(oauthAuthorizationCodes.userId, TEST_USER_ID));
    await db.delete(users).where(eq(users.id, TEST_USER_ID));
  });

  describe("createAuthorizationCode", () => {
    it("should create authorization code with valid parameters", async () => {
      const codeChallenge = await generateCodeChallenge(TEST_CODE_VERIFIER);

      const code = await createAuthorizationCode(
        TEST_USER_ID,
        codeChallenge,
        TEST_REDIRECT_URI,
        TEST_CLIENT_ID,
        TEST_STATE,
      );

      expect(code).toBeDefined();
      expect(code.length).toBe(32); // nanoid(32)

      // Verify code was stored in database
      const [storedCode] = await db
        .select()
        .from(oauthAuthorizationCodes)
        .where(eq(oauthAuthorizationCodes.id, code))
        .limit(1);

      expect(storedCode).toBeDefined();
      expect(storedCode.userId).toBe(TEST_USER_ID);
      expect(storedCode.codeChallenge).toBe(codeChallenge);
      expect(storedCode.redirectUri).toBe(TEST_REDIRECT_URI);
      expect(storedCode.clientId).toBe(TEST_CLIENT_ID);
      expect(storedCode.state).toBe(TEST_STATE);
    });

    it("should reject invalid redirect URI format", async () => {
      const codeChallenge = await generateCodeChallenge(TEST_CODE_VERIFIER);
      const invalidUri = "https://evil.com/oauth2";

      await expect(
        createAuthorizationCode(
          TEST_USER_ID,
          codeChallenge,
          invalidUri,
          TEST_CLIENT_ID,
          TEST_STATE,
        ),
      ).rejects.toThrow();
    });

    it("should reject redirect URI with mismatched client ID", async () => {
      const codeChallenge = await generateCodeChallenge(TEST_CODE_VERIFIER);
      const mismatchedUri =
        "https://zyxwvutsrqponmlkjihgfedcba987654.chromiumapp.org/oauth2";

      await expect(
        createAuthorizationCode(
          TEST_USER_ID,
          codeChallenge,
          mismatchedUri,
          TEST_CLIENT_ID,
          TEST_STATE,
        ),
      ).rejects.toThrow();
    });

    it("should set expiration time to 5 minutes", async () => {
      const codeChallenge = await generateCodeChallenge(TEST_CODE_VERIFIER);
      const beforeCreate = Date.now();

      const code = await createAuthorizationCode(
        TEST_USER_ID,
        codeChallenge,
        TEST_REDIRECT_URI,
        TEST_CLIENT_ID,
        TEST_STATE,
      );

      const afterCreate = Date.now();

      const [storedCode] = await db
        .select()
        .from(oauthAuthorizationCodes)
        .where(eq(oauthAuthorizationCodes.id, code))
        .limit(1);

      const expiresAt = storedCode.expiresAt.getTime();
      const expectedMin = beforeCreate + 5 * 60 * 1000;
      const expectedMax = afterCreate + 5 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe("exchangeAuthorizationCode", () => {
    it("should exchange valid authorization code for tokens", async () => {
      const codeChallenge = await generateCodeChallenge(TEST_CODE_VERIFIER);

      // Create authorization code
      const code = await createAuthorizationCode(
        TEST_USER_ID,
        codeChallenge,
        TEST_REDIRECT_URI,
        TEST_CLIENT_ID,
        TEST_STATE,
      );

      // Exchange code for tokens
      const result = await exchangeAuthorizationCode(
        code,
        TEST_CODE_VERIFIER,
        TEST_REDIRECT_URI,
        TEST_CLIENT_ID,
      );

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(TEST_USER_ID);
    });

    it("should reject invalid authorization code", async () => {
      const invalidCode = "invalid-code-123";

      await expect(
        exchangeAuthorizationCode(
          invalidCode,
          TEST_CODE_VERIFIER,
          TEST_REDIRECT_URI,
          TEST_CLIENT_ID,
        ),
      ).rejects.toThrow();
    });

    it("should reject expired authorization code", async () => {
      const codeChallenge = await generateCodeChallenge(TEST_CODE_VERIFIER);

      // Create authorization code
      const code = await createAuthorizationCode(
        TEST_USER_ID,
        codeChallenge,
        TEST_REDIRECT_URI,
        TEST_CLIENT_ID,
        TEST_STATE,
      );

      // Manually expire the code
      await db
        .update(oauthAuthorizationCodes)
        .set({ expiresAt: new Date(Date.now() - 1000) })
        .where(eq(oauthAuthorizationCodes.id, code));

      // Attempt to exchange expired code
      await expect(
        exchangeAuthorizationCode(
          code,
          TEST_CODE_VERIFIER,
          TEST_REDIRECT_URI,
          TEST_CLIENT_ID,
        ),
      ).rejects.toThrow();
    });

    it("should reject mismatched code verifier (PKCE validation)", async () => {
      const codeChallenge = await generateCodeChallenge(TEST_CODE_VERIFIER);
      const wrongVerifier = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

      // Create authorization code
      const code = await createAuthorizationCode(
        TEST_USER_ID,
        codeChallenge,
        TEST_REDIRECT_URI,
        TEST_CLIENT_ID,
        TEST_STATE,
      );

      // Attempt to exchange with wrong verifier
      await expect(
        exchangeAuthorizationCode(
          code,
          wrongVerifier,
          TEST_REDIRECT_URI,
          TEST_CLIENT_ID,
        ),
      ).rejects.toThrow();
    });

    it("should reject mismatched redirect URI", async () => {
      const codeChallenge = await generateCodeChallenge(TEST_CODE_VERIFIER);

      // Create authorization code
      const code = await createAuthorizationCode(
        TEST_USER_ID,
        codeChallenge,
        TEST_REDIRECT_URI,
        TEST_CLIENT_ID,
        TEST_STATE,
      );

      const wrongUri = `https://${TEST_CLIENT_ID}.chromiumapp.org/different`;

      // Attempt to exchange with wrong redirect URI
      await expect(
        exchangeAuthorizationCode(
          code,
          TEST_CODE_VERIFIER,
          wrongUri,
          TEST_CLIENT_ID,
        ),
      ).rejects.toThrow();
    });

    it("should reject mismatched client ID", async () => {
      const codeChallenge = await generateCodeChallenge(TEST_CODE_VERIFIER);

      // Create authorization code
      const code = await createAuthorizationCode(
        TEST_USER_ID,
        codeChallenge,
        TEST_REDIRECT_URI,
        TEST_CLIENT_ID,
        TEST_STATE,
      );

      const wrongClientId = "zyxwvutsrqponmlkjihgfedcba987654";

      // Attempt to exchange with wrong client ID
      await expect(
        exchangeAuthorizationCode(
          code,
          TEST_CODE_VERIFIER,
          TEST_REDIRECT_URI,
          wrongClientId,
        ),
      ).rejects.toThrow();
    });

    it("should delete authorization code after successful exchange (single-use)", async () => {
      const codeChallenge = await generateCodeChallenge(TEST_CODE_VERIFIER);

      // Create authorization code
      const code = await createAuthorizationCode(
        TEST_USER_ID,
        codeChallenge,
        TEST_REDIRECT_URI,
        TEST_CLIENT_ID,
        TEST_STATE,
      );

      // Exchange code for tokens
      await exchangeAuthorizationCode(
        code,
        TEST_CODE_VERIFIER,
        TEST_REDIRECT_URI,
        TEST_CLIENT_ID,
      );

      // Verify code was deleted
      const [deletedCode] = await db
        .select()
        .from(oauthAuthorizationCodes)
        .where(eq(oauthAuthorizationCodes.id, code))
        .limit(1);

      expect(deletedCode).toBeUndefined();
    });

    it("should reject reused authorization code", async () => {
      const codeChallenge = await generateCodeChallenge(TEST_CODE_VERIFIER);

      // Create authorization code
      const code = await createAuthorizationCode(
        TEST_USER_ID,
        codeChallenge,
        TEST_REDIRECT_URI,
        TEST_CLIENT_ID,
        TEST_STATE,
      );

      // First exchange - should succeed
      await exchangeAuthorizationCode(
        code,
        TEST_CODE_VERIFIER,
        TEST_REDIRECT_URI,
        TEST_CLIENT_ID,
      );

      // Second exchange - should fail
      await expect(
        exchangeAuthorizationCode(
          code,
          TEST_CODE_VERIFIER,
          TEST_REDIRECT_URI,
          TEST_CLIENT_ID,
        ),
      ).rejects.toThrow();
    });
  });

  describe("validateRedirectUri", () => {
    it("should accept valid Chrome extension redirect URI", () => {
      const uri = `https://${TEST_CLIENT_ID}.chromiumapp.org/oauth2`;
      const isValid = validateRedirectUri(uri, TEST_CLIENT_ID);
      expect(isValid).toBe(true);
    });

    it("should accept redirect URI with different path", () => {
      const uri = `https://${TEST_CLIENT_ID}.chromiumapp.org/callback`;
      const isValid = validateRedirectUri(uri, TEST_CLIENT_ID);
      expect(isValid).toBe(true);
    });

    it("should reject non-HTTPS URI", () => {
      const uri = `http://${TEST_CLIENT_ID}.chromiumapp.org/oauth2`;
      const isValid = validateRedirectUri(uri, TEST_CLIENT_ID);
      expect(isValid).toBe(false);
    });

    it("should reject wrong domain", () => {
      const uri = `https://${TEST_CLIENT_ID}.evil.com/oauth2`;
      const isValid = validateRedirectUri(uri, TEST_CLIENT_ID);
      expect(isValid).toBe(false);
    });

    it("should reject mismatched extension ID", () => {
      const wrongId = "zyxwvutsrqponmlkjihgfedcba987654";
      const uri = `https://${wrongId}.chromiumapp.org/oauth2`;
      const isValid = validateRedirectUri(uri, TEST_CLIENT_ID);
      expect(isValid).toBe(false);
    });

    it("should reject invalid extension ID format", () => {
      const uri = "https://invalid-id.chromiumapp.org/oauth2";
      const isValid = validateRedirectUri(uri, TEST_CLIENT_ID);
      expect(isValid).toBe(false);
    });

    it("should reject extension ID with wrong length", () => {
      const shortId = "abcdefghijklmnopqrstuvwxyz"; // 26 chars instead of 32
      const uri = `https://${shortId}.chromiumapp.org/oauth2`;
      const isValid = validateRedirectUri(uri, shortId);
      expect(isValid).toBe(false);
    });
  });

  describe("cleanupExpiredAuthorizationCodes", () => {
    it("should delete expired authorization codes", async () => {
      const codeChallenge = await generateCodeChallenge(TEST_CODE_VERIFIER);

      // Create an expired code
      const expiredCode = await createAuthorizationCode(
        TEST_USER_ID,
        codeChallenge,
        TEST_REDIRECT_URI,
        TEST_CLIENT_ID,
        TEST_STATE,
      );

      // Manually expire it
      await db
        .update(oauthAuthorizationCodes)
        .set({ expiresAt: new Date(Date.now() - 1000) })
        .where(eq(oauthAuthorizationCodes.id, expiredCode));

      // Run cleanup
      await cleanupExpiredAuthorizationCodes();

      // Verify code was deleted
      const [deletedCode] = await db
        .select()
        .from(oauthAuthorizationCodes)
        .where(eq(oauthAuthorizationCodes.id, expiredCode))
        .limit(1);

      expect(deletedCode).toBeUndefined();
    });

    it("should not delete valid authorization codes", async () => {
      const codeChallenge = await generateCodeChallenge(TEST_CODE_VERIFIER);

      // Create a valid code
      const validCode = await createAuthorizationCode(
        TEST_USER_ID,
        codeChallenge,
        TEST_REDIRECT_URI,
        TEST_CLIENT_ID,
        TEST_STATE,
      );

      // Run cleanup
      await cleanupExpiredAuthorizationCodes();

      // Verify code still exists
      const [storedCode] = await db
        .select()
        .from(oauthAuthorizationCodes)
        .where(eq(oauthAuthorizationCodes.id, validCode))
        .limit(1);

      expect(storedCode).toBeDefined();
    });
  });
});
