// Annotation API stubs for Notto backend integration
// Implement when backend is ready

import { get, post, put, del } from "./client";

export interface Annotation {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  type: "bug" | "improvement" | "question" | "";
  priority: "urgent" | "high" | "medium" | "low";
  pageUrl: string;
  pageTitle: string;
  screenshotUrl?: string;
  canvasData?: object;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnotationData {
  projectId: string;
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  pageUrl: string;
  pageTitle: string;
  screenshotAnnotatedBase64?: string; // Base64 data URL from canvas.toDataURL()
}

export interface UpdateAnnotationData {
  title?: string;
  description?: string;
  type?: string;
  priority?: string;
}

export async function listAnnotations(
  projectId: string,
): Promise<Annotation[]> {
  return get<Annotation[]>(`/projects/${projectId}/annotations`);
}

export async function getAnnotation(id: string): Promise<Annotation> {
  return get<Annotation>(`/annotations/${id}`);
}

export async function createAnnotation(
  data: CreateAnnotationData,
): Promise<Annotation> {
  return post<Annotation>(`/projects/${data.projectId}/annotations`, data);
}

export async function updateAnnotation(
  id: string,
  data: UpdateAnnotationData,
): Promise<Annotation> {
  return put<Annotation>(`/annotations/${id}`, data);
}

export async function deleteAnnotation(id: string): Promise<void> {
  return del<void>(`/annotations/${id}`);
}

export async function uploadScreenshot(
  annotationId: string,
  imageBase64: string,
): Promise<{ url: string }> {
  return post<{ url: string }>(`/annotations/${annotationId}/screenshot`, {
    image: imageBase64,
  });
}
