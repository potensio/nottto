/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0
 * Implements SHA-256 hashing and Base64-URL encoding for secure authorization code flow
 */

/**
 * Validates a PKCE code verifier against a code challenge
 * @param verifier - The code verifier (43-128 character Base64-URL encoded string)
 * @param challenge - The code challenge (Base64-URL encoded SHA-256 hash)
 * @returns True if the verifier matches the challenge, false otherwise
 */
export async function validatePKCE(
  verifier: string,
  challenge: string,
): Promise<boolean> {
  try {
    // Generate challenge from verifier
    const computedChallenge = await generateCodeChallenge(verifier);

    // Compare with stored challenge
    return computedChallenge === challenge;
  } catch (error) {
    console.error("PKCE validation error:", error);
    return false;
  }
}

/**
 * Generates a code challenge from a code verifier using SHA-256
 * @param verifier - The code verifier string
 * @returns Base64-URL encoded SHA-256 hash of the verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  // Encode the verifier as UTF-8
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);

  // Compute SHA-256 hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convert to Base64-URL encoding
  return base64UrlEncode(hashBuffer);
}

/**
 * Encodes an ArrayBuffer to Base64-URL format
 * @param buffer - The buffer to encode
 * @returns Base64-URL encoded string
 */
function base64UrlEncode(buffer: ArrayBuffer): string {
  // Convert buffer to byte array
  const bytes = new Uint8Array(buffer);

  // Convert to base64
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = Buffer.from(binary, "binary").toString("base64");

  // Convert to Base64-URL format (replace +/= with -_)
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
