// PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0
// Implements RFC 7636 for secure authorization code flow

/**
 * Generates a cryptographically secure code verifier
 * @returns Base64-URL encoded random string (43 characters)
 */
export function generateCodeVerifier(): string {
  // Generate 32 bytes of cryptographically secure random data
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);

  // Base64-URL encode the random bytes
  return base64UrlEncode(randomBytes);
}

/**
 * Generates a code challenge from a code verifier
 * @param verifier - The code verifier to hash
 * @returns Promise resolving to Base64-URL encoded SHA-256 hash
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  // Encode the verifier as UTF-8
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);

  // Compute SHA-256 hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Base64-URL encode the hash
  return base64UrlEncode(new Uint8Array(hashBuffer));
}

/**
 * Generates a cryptographically secure state parameter for CSRF protection
 * @returns Base64-URL encoded random string
 */
export function generateState(): string {
  // Generate 16 bytes of cryptographically secure random data
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);

  // Base64-URL encode the random bytes
  return base64UrlEncode(randomBytes);
}

/**
 * Base64-URL encodes a Uint8Array
 * @param buffer - The buffer to encode
 * @returns Base64-URL encoded string
 */
function base64UrlEncode(buffer: Uint8Array): string {
  // Convert buffer to base64
  const base64 = btoa(String.fromCharCode(...Array.from(buffer)));

  // Convert to base64url by replacing characters and removing padding
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
