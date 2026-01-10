import { eq, and } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../db";
import { annotations, projects } from "@nottto/shared/db";
import { checkProjectAccess } from "./projects";
import type {
  Annotation,
  CreateAnnotationInput,
  UpdateAnnotationInput,
} from "@nottto/shared";

export async function list(
  projectId: string,
  userId: string
): Promise<Annotation[]> {
  // Check project access
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    throw new HTTPException(403, { message: "Access denied to this project" });
  }

  const annotationList = await db
    .select()
    .from(annotations)
    .where(eq(annotations.projectId, projectId));

  return annotationList.map((a) => ({
    id: a.id,
    projectId: a.projectId,
    userId: a.userId,
    title: a.title,
    description: a.description,
    type: a.type as Annotation["type"],
    priority: a.priority as Annotation["priority"],
    pageUrl: a.pageUrl,
    pageTitle: a.pageTitle,
    screenshotOriginal: a.screenshotOriginal,
    screenshotAnnotated: a.screenshotAnnotated,
    canvasData: a.canvasData,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));
}

export async function create(
  projectId: string,
  userId: string,
  data: CreateAnnotationInput
): Promise<Annotation> {
  // Check project access
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    throw new HTTPException(403, { message: "Access denied to this project" });
  }

  const [newAnnotation] = await db
    .insert(annotations)
    .values({
      projectId,
      userId,
      title: data.title,
      description: data.description || null,
      type: data.type || null,
      priority: data.priority || null,
      pageUrl: data.pageUrl || null,
      pageTitle: data.pageTitle || null,
      screenshotOriginal: data.screenshotOriginal || null,
      screenshotAnnotated: data.screenshotAnnotated || null,
      canvasData: data.canvasData || null,
    })
    .returning();

  return {
    id: newAnnotation.id,
    projectId: newAnnotation.projectId,
    userId: newAnnotation.userId,
    title: newAnnotation.title,
    description: newAnnotation.description,
    type: newAnnotation.type as Annotation["type"],
    priority: newAnnotation.priority as Annotation["priority"],
    pageUrl: newAnnotation.pageUrl,
    pageTitle: newAnnotation.pageTitle,
    screenshotOriginal: newAnnotation.screenshotOriginal,
    screenshotAnnotated: newAnnotation.screenshotAnnotated,
    canvasData: newAnnotation.canvasData,
    createdAt: newAnnotation.createdAt,
    updatedAt: newAnnotation.updatedAt,
  };
}

export async function get(
  annotationId: string,
  userId: string
): Promise<Annotation> {
  const [annotation] = await db
    .select()
    .from(annotations)
    .where(eq(annotations.id, annotationId))
    .limit(1);

  if (!annotation) {
    throw new HTTPException(404, { message: "Annotation not found" });
  }

  // Check project access
  const hasAccess = await checkProjectAccess(annotation.projectId, userId);
  if (!hasAccess) {
    throw new HTTPException(403, {
      message: "Access denied to this annotation",
    });
  }

  return {
    id: annotation.id,
    projectId: annotation.projectId,
    userId: annotation.userId,
    title: annotation.title,
    description: annotation.description,
    type: annotation.type as Annotation["type"],
    priority: annotation.priority as Annotation["priority"],
    pageUrl: annotation.pageUrl,
    pageTitle: annotation.pageTitle,
    screenshotOriginal: annotation.screenshotOriginal,
    screenshotAnnotated: annotation.screenshotAnnotated,
    canvasData: annotation.canvasData,
    createdAt: annotation.createdAt,
    updatedAt: annotation.updatedAt,
  };
}

export async function update(
  annotationId: string,
  userId: string,
  data: UpdateAnnotationInput
): Promise<Annotation> {
  const [annotation] = await db
    .select()
    .from(annotations)
    .where(eq(annotations.id, annotationId))
    .limit(1);

  if (!annotation) {
    throw new HTTPException(404, { message: "Annotation not found" });
  }

  // Check project access
  const hasAccess = await checkProjectAccess(annotation.projectId, userId);
  if (!hasAccess) {
    throw new HTTPException(403, {
      message: "Access denied to this annotation",
    });
  }

  // Only the creator can update (or anyone with project access for now)
  // You could add stricter checks here if needed

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.pageUrl !== undefined) updateData.pageUrl = data.pageUrl;
  if (data.pageTitle !== undefined) updateData.pageTitle = data.pageTitle;
  if (data.screenshotOriginal !== undefined)
    updateData.screenshotOriginal = data.screenshotOriginal;
  if (data.screenshotAnnotated !== undefined)
    updateData.screenshotAnnotated = data.screenshotAnnotated;
  if (data.canvasData !== undefined) updateData.canvasData = data.canvasData;

  const [updated] = await db
    .update(annotations)
    .set(updateData)
    .where(eq(annotations.id, annotationId))
    .returning();

  return {
    id: updated.id,
    projectId: updated.projectId,
    userId: updated.userId,
    title: updated.title,
    description: updated.description,
    type: updated.type as Annotation["type"],
    priority: updated.priority as Annotation["priority"],
    pageUrl: updated.pageUrl,
    pageTitle: updated.pageTitle,
    screenshotOriginal: updated.screenshotOriginal,
    screenshotAnnotated: updated.screenshotAnnotated,
    canvasData: updated.canvasData,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

export async function remove(
  annotationId: string,
  userId: string
): Promise<void> {
  const [annotation] = await db
    .select()
    .from(annotations)
    .where(eq(annotations.id, annotationId))
    .limit(1);

  if (!annotation) {
    throw new HTTPException(404, { message: "Annotation not found" });
  }

  // Check project access
  const hasAccess = await checkProjectAccess(annotation.projectId, userId);
  if (!hasAccess) {
    throw new HTTPException(403, {
      message: "Access denied to this annotation",
    });
  }

  await db.delete(annotations).where(eq(annotations.id, annotationId));
}
