import { eq, and } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../db";
import { projects, workspaces } from "@notto/shared/db";
import { checkAccess as checkWorkspaceAccess } from "./workspaces";
import { generateSlug, generateUniqueSlug } from "../utils/slug";
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
} from "@notto/shared";

export async function list(
  workspaceId: string,
  userId: string,
): Promise<Project[]> {
  // Check workspace access
  const hasAccess = await checkWorkspaceAccess(workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException(403, {
      message: "Access denied to this workspace",
    });
  }

  const projectList = await db
    .select()
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId));

  return projectList.map((p) => ({
    id: p.id,
    workspaceId: p.workspaceId,
    name: p.name,
    slug: p.slug,
    description: p.description,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
}

export async function create(
  workspaceId: string,
  userId: string,
  data: CreateProjectInput,
): Promise<Project> {
  // Check workspace access
  const hasAccess = await checkWorkspaceAccess(workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException(403, {
      message: "Access denied to this workspace",
    });
  }

  // Get existing slugs in this workspace
  const existingProjects = await db
    .select({ slug: projects.slug })
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId));

  const existingSlugs = existingProjects.map((p) => p.slug);
  const slug = generateUniqueSlug(data.name, existingSlugs);

  const [newProject] = await db
    .insert(projects)
    .values({
      workspaceId,
      name: data.name,
      slug,
      description: data.description || null,
    })
    .returning();

  return {
    id: newProject.id,
    workspaceId: newProject.workspaceId,
    name: newProject.name,
    slug: newProject.slug,
    description: newProject.description,
    createdAt: newProject.createdAt,
    updatedAt: newProject.updatedAt,
  };
}

export async function get(projectId: string, userId: string): Promise<Project> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    throw new HTTPException(404, { message: "Project not found" });
  }

  // Check workspace access
  const hasAccess = await checkWorkspaceAccess(project.workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException(403, { message: "Access denied to this project" });
  }

  return {
    id: project.id,
    workspaceId: project.workspaceId,
    name: project.name,
    slug: project.slug,
    description: project.description,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export async function update(
  projectId: string,
  userId: string,
  data: UpdateProjectInput,
): Promise<Project> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    throw new HTTPException(404, { message: "Project not found" });
  }

  // Check workspace access
  const hasAccess = await checkWorkspaceAccess(project.workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException(403, { message: "Access denied to this project" });
  }

  // Check slug uniqueness if updating slug
  if (data.slug && data.slug !== project.slug) {
    const [existing] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.workspaceId, project.workspaceId),
          eq(projects.slug, data.slug),
        ),
      )
      .limit(1);

    if (existing) {
      throw new HTTPException(409, {
        message: "Slug already in use in this workspace",
      });
    }
  }

  const [updated] = await db
    .update(projects)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId))
    .returning();

  return {
    id: updated.id,
    workspaceId: updated.workspaceId,
    name: updated.name,
    slug: updated.slug,
    description: updated.description,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

export async function remove(projectId: string, userId: string): Promise<void> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    throw new HTTPException(404, { message: "Project not found" });
  }

  // Check workspace access
  const hasAccess = await checkWorkspaceAccess(project.workspaceId, userId);
  if (!hasAccess) {
    throw new HTTPException(403, { message: "Access denied to this project" });
  }

  // Cascade delete is handled by database constraints
  await db.delete(projects).where(eq(projects.id, projectId));
}

// Helper to check if user has access to a project
export async function checkProjectAccess(
  projectId: string,
  userId: string,
): Promise<boolean> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    return false;
  }

  return checkWorkspaceAccess(project.workspaceId, userId);
}
