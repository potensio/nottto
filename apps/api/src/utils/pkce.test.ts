/**
 * PKCE utility tests
 * Tests PKCE validation, code challenge generation, and security properties
 */

import { describe, it, expect } from "bun:test";
import { validatePKCE, generateCodeChallenge } from "./pkce";

describe("PKCE Utilities", () => {
  describe("validatePKCE", () => {
    it("should validate correct code verifier against its challenge", async () => {
      // Generate a valid verifier (43 characters, Base64-URL encoded)
      const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
      const challenge = await generateCodeChallenge(verifier);

      const isValid = await validatePKCE(verifier, challenge);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect code verifier", async () => {
      const verifier1 = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
      const verifier2 = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
      const challenge = await generateCodeChallenge(verifier1);

      const isValid = await validatePKCE(verifier2, challenge);
      expect(isValid).toBe(false);
    });

    it("should reject empty verifier", async () => {
      const challenge = await generateCodeChallenge("valid-verifier");
      const isValid = await validatePKCE("", challenge);
      expect(isValid).toBe(false);
    });

    it("should reject empty challenge", async () => {
      const isValid = await validatePKCE("valid-verifier", "");
      expect(isValid).toBe(false);
    });
  });

  describe("generateCodeChallenge", () => {
    it("should generate deterministic challenge from verifier", async () => {
      const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
      const challenge1 = await generateCodeChallenge(verifier);
      const challenge2 = await generateCodeChallenge(verifier);

      expect(challenge1).toBe(challenge2);
    });

    it("should generate different challenges for different verifiers", async () => {
      const verifier1 = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
      const verifier2 = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

      const challenge1 = await generateCodeChallenge(verifier1);
      const challenge2 = await generateCodeChallenge(verifier2);

      expect(challenge1).not.toBe(challenge2);
    });

    it("should generate Base64-URL encoded string", async () => {
      const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
      const challenge = await generateCodeChallenge(verifier);

      // Base64-URL should only contain [A-Za-z0-9_-]
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
      // Should not contain padding
      expect(challenge).not.toContain("=");
    });

    it("should generate 43-character challenge for 32-byte verifier", async () => {
      // SHA-256 produces 32 bytes, which Base64-URL encodes to 43 characters
      const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
      const challenge = await generateCodeChallenge(verifier);

      expect(challenge.length).toBe(43);
    });
  });
});
