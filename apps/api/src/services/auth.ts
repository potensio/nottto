import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../db";
import {
  users,
  workspaces,
  workspaceMembers,
  projects,
} from "@nottto/shared/db";
import {
  hashPassword,
  verifyPassword,
  generateTokens,
  verifyRefreshToken,
  generateAccessToken,
} from "../utils/auth";
import { generateSlug } from "../utils/slug";
import type { User, AuthResponse, RefreshResponse } from "@nottto/shared";

export async function register(
  email: string,
  password: string,
  name?: string
): Promise<AuthResponse> {
  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new HTTPException(409, { message: "Email already registered" });
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name: name || null,
    })
    .returning();

  // Create default workspace
  const workspaceSlug = generateSlug("My Workspace");
  const [newWorkspace] = await db
    .insert(workspaces)
    .values({
      name: "My Workspace",
      slug: workspaceSlug,
      ownerId: newUser.id,
    })
    .returning();

  // Add user as workspace owner member
  await db.insert(workspaceMembers).values({
    workspaceId: newWorkspace.id,
    userId: newUser.id,
    role: "owner",
  });

  // Create default project
  const projectSlug = generateSlug("Default Project");
  await db.insert(projects).values({
    workspaceId: newWorkspace.id,
    name: "Default Project",
    slug: projectSlug,
    description: "Your first project",
  });

  // Generate tokens
  const tokens = await generateTokens({
    sub: newUser.id,
    email: newUser.email,
  });

  const user: User = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    profilePicture: newUser.profilePicture,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt,
  };

  return { user, tokens };
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  // Find user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new HTTPException(401, { message: "Invalid email or password" });
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new HTTPException(401, { message: "Invalid email or password" });
  }

  // Generate tokens
  const tokens = await generateTokens({
    sub: user.id,
    email: user.email,
  });

  const userResponse: User = {
    id: user.id,
    email: user.email,
    name: user.name,
    profilePicture: user.profilePicture,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return { user: userResponse, tokens };
}

export async function refresh(refreshToken: string): Promise<RefreshResponse> {
  try {
    const payload = await verifyRefreshToken(refreshToken);

    // Verify user still exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user) {
      throw new HTTPException(401, { message: "User not found" });
    }

    // Generate new access token
    const accessToken = await generateAccessToken({
      sub: user.id,
      email: user.email,
    });

    return { accessToken };
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(401, {
      message: "Invalid or expired refresh token",
    });
  }
}

export async function getUser(userId: string): Promise<User> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new HTTPException(404, { message: "User not found" });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    profilePicture: user.profilePicture,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function updateUser(
  userId: string,
  data: { name?: string; profilePicture?: string | null }
): Promise<User> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new HTTPException(404, { message: "User not found" });
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    profilePicture: updatedUser.profilePicture,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };
}

export async function deleteUser(userId: string): Promise<void> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new HTTPException(404, { message: "User not found" });
  }

  // Delete user - cascades will handle related data
  await db.delete(users).where(eq(users.id, userId));
}
