import { lt, or, isNotNull } from "drizzle-orm";
import { db } from "../db";
import { magicLinkTokens, rateLimitRecords } from "@nottto/shared/db";

/**
 * Cleans up expired or used magic link tokens.
 * Tokens are deleted if:
 * - They have expired (expiresAt < now)
 * - They have been used (usedAt is not null)
 */
export async function cleanupMagicLinkTokens(): Promise<number> {
  const now = new Date();

  const result = await db
    .delete(magicLinkTokens)
    .where(
      or(lt(magicLinkTokens.expiresAt, now), isNotNull(magicLinkTokens.usedAt))
    )
    .returning();

  if (result.length > 0) {
    console.log(`Cleaned up ${result.length} magic link tokens`);
  }

  return result.length;
}

/**
 * Cleans up old rate limit records.
 * Records older than 1 hour are deleted.
 */
export async function cleanupRateLimitRecords(): Promise<number> {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const result = await db
    .delete(rateLimitRecords)
    .where(lt(rateLimitRecords.createdAt, oneHourAgo))
    .returning();

  if (result.length > 0) {
    console.log(`Cleaned up ${result.length} rate limit records`);
  }

  return result.length;
}

/**
 * Runs all cleanup tasks.
 * Should be called periodically (e.g., every hour via cron).
 */
export async function runCleanup(): Promise<{
  magicLinkTokens: number;
  rateLimitRecords: number;
}> {
  const [magicLinkCount, rateLimitCount] = await Promise.all([
    cleanupMagicLinkTokens(),
    cleanupRateLimitRecords(),
  ]);

  return {
    magicLinkTokens: magicLinkCount,
    rateLimitRecords: rateLimitCount,
  };
}
