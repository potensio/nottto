import { eq, and, gt, lt } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../db";
import { users, extensionAuthSessions } from "@nottto/shared/db";
import { generateTokens } from "../utils/auth";
import { nanoid } from "nanoid";

const SESSION_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export interface AuthSessionResponse {
  sessionId: string;
  expiresAt: string;
}

export interface AuthSessionStatus {
  status: "pending" | "completed" | "expired";
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

/**
 * Creates a new extension auth session.
 * Returns a session ID that the extension uses to poll for completion.
 */
export async function createAuthSession(): Promise<AuthSessionResponse> {
  const sessionId = nanoid(32);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);

  await db.insert(extensionAuthSessions).values({
    id: sessionId,
    status: "pending",
    expiresAt,
  });

  return {
    sessionId,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Gets the status of an auth session.
 * If completed, returns the tokens and user info.
 */
export async function getAuthSession(
  sessionId: string
): Promise<AuthSessionStatus> {
  const [session] = await db
    .select()
    .from(extensionAuthSessions)
    .where(eq(extensionAuthSessions.id, sessionId))
    .limit(1);

  if (!session) {
    throw new HTTPException(404, { message: "Session not found" });
  }

  // Check if expired
  if (new Date() > session.expiresAt) {
    // Clean up expired session
    await db
      .delete(extensionAuthSessions)
      .where(eq(extensionAuthSessions.id, sessionId));
    return { status: "expired" };
  }

  if (session.status === "pending") {
    return { status: "pending" };
  }

  if (session.status === "completed" && session.userId) {
    // Get user info
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      throw new HTTPException(404, { message: "User not found" });
    }

    // Generate fresh tokens for the extension
    const tokens = await generateTokens({
      sub: user.id,
      email: user.email,
    });

    // Delete the session after successful retrieval (one-time use)
    await db
      .delete(extensionAuthSessions)
      .where(eq(extensionAuthSessions.id, sessionId));

    return {
      status: "completed",
      tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  return { status: "pending" };
}

/**
 * Completes an auth session by linking it to a user.
 * Called by the web app after successful authentication.
 */
export async function completeAuthSession(
  sessionId: string,
  userId: string
): Promise<{ success: boolean }> {
  const [session] = await db
    .select()
    .from(extensionAuthSessions)
    .where(
      and(
        eq(extensionAuthSessions.id, sessionId),
        gt(extensionAuthSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!session) {
    throw new HTTPException(404, {
      message: "Session not found or expired",
    });
  }

  if (session.status === "completed") {
    throw new HTTPException(400, {
      message: "Session already completed",
    });
  }

  // Update session with user ID
  await db
    .update(extensionAuthSessions)
    .set({
      status: "completed",
      userId,
      completedAt: new Date(),
    })
    .where(eq(extensionAuthSessions.id, sessionId));

  return { success: true };
}

/**
 * Deletes an auth session (cleanup).
 */
export async function deleteAuthSession(sessionId: string): Promise<void> {
  await db
    .delete(extensionAuthSessions)
    .where(eq(extensionAuthSessions.id, sessionId));
}

/**
 * Cleanup expired sessions (can be called periodically).
 */
export async function cleanupExpiredSessions(): Promise<number> {
  await db
    .delete(extensionAuthSessions)
    .where(lt(extensionAuthSessions.expiresAt, new Date()));

  return 0; // Drizzle doesn't return count easily, but cleanup is done
}
