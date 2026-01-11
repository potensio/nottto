import { randomBytes, createHash, timingSafeEqual } from "crypto";

const TOKEN_BYTES = 32; // 256 bits of entropy

/**
 * Generates a cryptographically secure random token for magic links.
 * Returns a URL-safe base64 encoded string.
 */
export function generateSecureToken(): string {
  const buffer = randomBytes(TOKEN_BYTES);
  return buffer.toString("base64url");
}

/**
 * Hashes a token using SHA-256 for secure storage.
 * The hash is returned as a hex string.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Verifies a token against a stored hash using timing-safe comparison.
 * Returns true if the token matches the hash.
 */
export function verifyTokenHash(token: string, storedHash: string): boolean {
  const tokenHash = hashToken(token);

  // Convert to buffers for timing-safe comparison
  const tokenHashBuffer = Buffer.from(tokenHash, "hex");
  const storedHashBuffer = Buffer.from(storedHash, "hex");

  // Ensure same length before comparison
  if (tokenHashBuffer.length !== storedHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(tokenHashBuffer, storedHashBuffer);
}

/**
 * Generates the expiration timestamp for a magic link token.
 * Default expiration is 15 minutes from now.
 */
export function getTokenExpiration(minutes: number = 15): Date {
  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + minutes);
  return expiration;
}

/**
 * Checks if a token has expired.
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Masks an email address for display (e.g., "j***@example.com")
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return email;

  const visibleChars = Math.min(2, localPart.length);
  const masked = localPart.slice(0, visibleChars) + "***";

  return `${masked}@${domain}`;
}
