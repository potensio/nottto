import { eq, and, isNull } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../db";
import {
  users,
  magicLinkTokens,
  workspaces,
  workspaceMembers,
  projects,
} from "@notto/shared/db";
import {
  generateSecureToken,
  hashToken,
  verifyTokenHash,
  getTokenExpiration,
  isTokenExpired,
  maskEmail,
} from "../utils/magic-link";
import { generateTokens } from "../utils/auth";
import { generateSlug, generateUniqueSlug } from "../utils/slug";
import { sendMagicLinkEmail } from "./email";
import { checkMagicLinkLimit, recordMagicLinkRequest } from "./rate-limiter";
import type { User, AuthResponse } from "@notto/shared";

const WEB_URL = process.env.WEB_URL || "http://localhost:3000";

export interface MagicLinkRequestResult {
  message: string;
  email: string; // Masked email
}

export interface MagicLinkVerifyResult extends AuthResponse {
  isNewUser: boolean;
}

/**
 * Requests a magic link to be sent to the provided email.
 * Distinguishes between login (existing users) and register (new users).
 * Optionally includes extension session ID for extension auth flow.
 */
export async function requestMagicLink(
  email: string,
  isRegister: boolean = false,
  name?: string,
  extensionSession?: string,
): Promise<MagicLinkRequestResult> {
  const normalizedEmail = email.toLowerCase().trim();

  // Check rate limit
  const rateLimit = await checkMagicLinkLimit(normalizedEmail);
  if (!rateLimit.allowed) {
    throw new HTTPException(429, {
      message: "Too many requests. Please try again later.",
      // @ts-ignore - Adding custom property for retry-after
      retryAfter: rateLimit.retryAfter,
    });
  }

  // Check if user exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  // Handle login vs register distinction
  if (isRegister) {
    // Registration: user should NOT exist
    if (existingUser) {
      throw new HTTPException(409, {
        message:
          "An account with this email already exists. Please login instead.",
      });
    }
    // Validate name for registration
    if (!name || name.trim().length === 0) {
      throw new HTTPException(400, {
        message: "Full name is required for registration.",
      });
    }
  } else {
    // Login: user SHOULD exist
    if (!existingUser) {
      throw new HTTPException(404, {
        message: "No account found with this email. Please register first.",
      });
    }
  }

  // Generate secure token
  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const expiresAt = getTokenExpiration(15); // 15 minutes

  // Store hashed token with registration data
  await db.insert(magicLinkTokens).values({
    email: normalizedEmail,
    tokenHash,
    name: isRegister ? name?.trim() : null,
    isRegister,
    expiresAt,
  });

  // Record rate limit
  await recordMagicLinkRequest(normalizedEmail);

  // Build magic link URL (include extension session if provided)
  let magicLinkUrl = `${WEB_URL}/auth/verify?token=${encodeURIComponent(
    token,
  )}`;
  if (extensionSession) {
    magicLinkUrl += `&session=${encodeURIComponent(extensionSession)}`;
  }

  // Send email
  const emailResult = await sendMagicLinkEmail(normalizedEmail, magicLinkUrl);
  if (!emailResult.success) {
    throw new HTTPException(500, {
      message: "Failed to send email. Please try again.",
    });
  }

  return {
    message: "Magic link sent! Check your email.",
    email: maskEmail(normalizedEmail),
  };
}

/**
 * Verifies a magic link token and returns session tokens.
 * Creates user, workspace, and project if this is a new user (registration).
 */
export async function verifyMagicLink(
  token: string,
): Promise<MagicLinkVerifyResult> {
  const tokenHash = hashToken(token);

  // Find token by hash
  const [tokenRecord] = await db
    .select()
    .from(magicLinkTokens)
    .where(
      and(
        eq(magicLinkTokens.tokenHash, tokenHash),
        isNull(magicLinkTokens.usedAt),
      ),
    )
    .limit(1);

  if (!tokenRecord) {
    throw new HTTPException(401, {
      message: "Invalid or expired link. Please request a new one.",
    });
  }

  // Check expiration
  if (isTokenExpired(tokenRecord.expiresAt)) {
    // Mark as used to prevent future attempts
    await db
      .update(magicLinkTokens)
      .set({ usedAt: new Date() })
      .where(eq(magicLinkTokens.id, tokenRecord.id));

    throw new HTTPException(401, {
      message: "This link has expired. Please request a new one.",
    });
  }

  // Mark token as used
  await db
    .update(magicLinkTokens)
    .set({ usedAt: new Date() })
    .where(eq(magicLinkTokens.id, tokenRecord.id));

  // Find or create user
  let [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, tokenRecord.email))
    .limit(1);

  let isNewUser = false;

  if (!existingUser) {
    isNewUser = true;

    // Create new user with name from token (for registration)
    const [newUser] = await db
      .insert(users)
      .values({
        email: tokenRecord.email,
        name: tokenRecord.name || null, // Use name from registration token
        passwordHash: null, // Passwordless user
      })
      .returning();

    existingUser = newUser;

    // Create default workspace using user's fullname as the slug
    const existingWorkspaces = await db
      .select({ slug: workspaces.slug })
      .from(workspaces);
    const existingSlugs = existingWorkspaces.map((w) => w.slug);
    const workspaceName = tokenRecord.name || "Personal";
    const workspaceSlug = generateUniqueSlug(workspaceName, existingSlugs);

    const [newWorkspace] = await db
      .insert(workspaces)
      .values({
        name: workspaceName,
        slug: workspaceSlug,
        icon: "📁", // Default icon
        ownerId: newUser.id,
      })
      .returning();

    // Add user as workspace owner
    await db.insert(workspaceMembers).values({
      workspaceId: newWorkspace.id,
      userId: newUser.id,
      role: "owner",
    });

    // Create default project with unique slug within workspace
    const existingProjects = await db
      .select({ slug: projects.slug })
      .from(projects)
      .where(eq(projects.workspaceId, newWorkspace.id));
    const existingProjectSlugs = existingProjects.map((p) => p.slug);
    const projectSlug = generateUniqueSlug(
      "My First Project",
      existingProjectSlugs,
    );

    await db.insert(projects).values({
      workspaceId: newWorkspace.id,
      name: "My First Project",
      slug: projectSlug,
      description: "Your first project - start capturing feedback!",
    });
  }

  // Generate session tokens
  const tokens = await generateTokens({
    sub: existingUser.id,
    email: existingUser.email,
  });

  const user: User = {
    id: existingUser.id,
    email: existingUser.email,
    name: existingUser.name,
    profilePicture: existingUser.profilePicture,
    createdAt: existingUser.createdAt,
    updatedAt: existingUser.updatedAt,
  };

  return { user, tokens, isNewUser };
}
