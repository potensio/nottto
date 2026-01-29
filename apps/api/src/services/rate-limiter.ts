import { eq, and, gte, lt } from "drizzle-orm";
import { db } from "../db";
import { rateLimitRecords } from "@notto/shared/db";

const MAGIC_LINK_LIMIT = 50; // Maximum requests per window (temporarily increased for testing)
const WINDOW_HOURS = 1; // Time window in hours

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number; // Seconds until rate limit resets
}

/**
 * Checks if a magic link request is allowed for the given email.
 * Returns rate limit status including remaining requests.
 */
export async function checkMagicLinkLimit(
  email: string,
): Promise<RateLimitResult> {
  const windowStart = getWindowStart();

  // Count requests in the current window
  const requests = await db
    .select()
    .from(rateLimitRecords)
    .where(
      and(
        eq(rateLimitRecords.identifier, email.toLowerCase()),
        eq(rateLimitRecords.action, "magic_link"),
        gte(rateLimitRecords.createdAt, windowStart),
      ),
    );

  const count = requests.length;
  const remaining = Math.max(0, MAGIC_LINK_LIMIT - count);
  const allowed = count < MAGIC_LINK_LIMIT;

  if (!allowed) {
    // Calculate retry-after based on oldest request in window
    const oldestRequest = requests.reduce((oldest, req) =>
      req.createdAt < oldest.createdAt ? req : oldest,
    );
    const resetTime = new Date(oldestRequest.createdAt);
    resetTime.setHours(resetTime.getHours() + WINDOW_HOURS);
    const retryAfter = Math.ceil((resetTime.getTime() - Date.now()) / 1000);

    return { allowed, remaining, retryAfter: Math.max(0, retryAfter) };
  }

  return { allowed, remaining };
}

/**
 * Records a magic link request for rate limiting purposes.
 */
export async function recordMagicLinkRequest(email: string): Promise<void> {
  await db.insert(rateLimitRecords).values({
    identifier: email.toLowerCase(),
    action: "magic_link",
  });
}

/**
 * Cleans up old rate limit records outside the time window.
 * Should be called periodically to prevent table bloat.
 */
export async function cleanupRateLimitRecords(): Promise<number> {
  const windowStart = getWindowStart();

  const result = await db
    .delete(rateLimitRecords)
    .where(lt(rateLimitRecords.createdAt, windowStart))
    .returning();

  return result.length;
}

/**
 * Gets the start of the current rate limit window.
 */
function getWindowStart(): Date {
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - WINDOW_HOURS);
  return windowStart;
}
