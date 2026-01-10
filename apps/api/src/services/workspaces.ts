import { eq, or, and } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../db";
import {
  workspaces,
  workspaceMembers,
  projects,
  annotations,
} from "@bugfinder/shared/db";
import { generateSlug, generateUniqueSlug } from "../utils/slug";
import type {
  Workspace,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "@bugfinder/shared";

export async function list(userId: string): Promise<Workspace[]> {
  // Get workspaces where user is owner or member
  const ownedWorkspaces = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, userId));

  const memberWorkspaces = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      ownerId: workspaces.ownerId,
      createdAt: workspaces.createdAt,
      updatedAt: workspaces.updatedAt,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId));

  // Combine and deduplicate
  const allWorkspaces = [...ownedWorkspaces];
  for (const ws of memberWorkspaces) {
    if (!allWorkspaces.find((w) => w.id === ws.id)) {
      allWorkspaces.push(ws);
    }
  }

  return allWorkspaces.map((ws) => ({
    id: ws.id,
    name: ws.name,
    slug: ws.slug,
    ownerId: ws.ownerId,
    createdAt: ws.createdAt,
    updatedAt: ws.updatedAt,
  }));
}

export async function create(
  userId: string,
  data: CreateWorkspaceInput
): Promise<Workspace> {
  // Get existing slugs to ensure uniqueness
  const existingWorkspaces = await db
    .select({ slug: workspaces.slug })
    .from(workspaces);
  const existingSlugs = existingWorkspaces.map((w) => w.slug);

  const slug = generateUniqueSlug(data.name, existingSlugs);

  const [newWorkspace] = await db
    .insert(workspaces)
    .values({
      name: data.name,
      slug,
      ownerId: userId,
    })
    .returning();

  // Add user as owner member
  await db.insert(workspaceMembers).values({
    workspaceId: newWorkspace.id,
    userId,
    role: "owner",
  });

  return {
    id: newWorkspace.id,
    name: newWorkspace.name,
    slug: newWorkspace.slug,
    ownerId: newWorkspace.ownerId,
    createdAt: newWorkspace.createdAt,
    updatedAt: newWorkspace.updatedAt,
  };
}

export async function get(
  workspaceId: string,
  userId: string
): Promise<Workspace> {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  // Check if user has access
  const hasAccess = await checkAccess(workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException(403, {
      message: "Access denied to this workspace",
    });
  }

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    ownerId: workspace.ownerId,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };
}

export async function update(
  workspaceId: string,
  userId: string,
  data: UpdateWorkspaceInput
): Promise<Workspace> {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  // Only owner can update
  if (workspace.ownerId !== userId) {
    throw new HTTPException(403, {
      message: "Only the owner can update this workspace",
    });
  }

  // Check slug uniqueness if updating slug
  if (data.slug && data.slug !== workspace.slug) {
    const [existing] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.slug, data.slug))
      .limit(1);

    if (existing) {
      throw new HTTPException(409, { message: "Slug already in use" });
    }
  }

  const [updated] = await db
    .update(workspaces)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(workspaces.id, workspaceId))
    .returning();

  return {
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    ownerId: updated.ownerId,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

export async function remove(
  workspaceId: string,
  userId: string
): Promise<void> {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  // Only owner can delete
  if (workspace.ownerId !== userId) {
    throw new HTTPException(403, {
      message: "Only the owner can delete this workspace",
    });
  }

  // Cascade delete is handled by database constraints
  await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
}

// Helper function to check if user has access to workspace
export async function checkAccess(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  // Check if owner
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, userId)))
    .limit(1);

  if (workspace) {
    return true;
  }

  // Check if member
  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      )
    )
    .limit(1);

  return !!member;
}
