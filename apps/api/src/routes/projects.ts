import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { updateProjectSchema, createAnnotationSchema } from "@notto/shared";
import { authMiddleware } from "../middleware/auth";
import * as projectService from "../services/projects";
import * as annotationService from "../services/annotations";

export const projectRoutes = new Hono();

// All project routes require authentication
projectRoutes.use("*", authMiddleware);

// GET /projects/:id - Get project details
projectRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const projectId = c.req.param("id");
  const project = await projectService.get(projectId, userId);
  return c.json({ project });
});

// PATCH /projects/:id - Update project
projectRoutes.patch(
  "/:id",
  zValidator("json", updateProjectSchema),
  async (c) => {
    const userId = c.get("userId");
    const projectId = c.req.param("id");
    const data = c.req.valid("json");
    const project = await projectService.update(projectId, userId, data);
    return c.json({ project });
  },
);

// DELETE /projects/:id - Delete project
projectRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const projectId = c.req.param("id");
  await projectService.remove(projectId, userId);
  return c.body(null, 204);
});

// GET /projects/:projectId/annotations - List annotations in project
projectRoutes.get("/:projectId/annotations", async (c) => {
  const userId = c.get("userId");
  const projectId = c.req.param("projectId");
  const annotations = await annotationService.list(projectId, userId);
  return c.json({ annotations });
});

// POST /projects/:projectId/annotations - Create annotation in project
projectRoutes.post(
  "/:projectId/annotations",
  zValidator("json", createAnnotationSchema),
  async (c) => {
    const userId = c.get("userId");
    const projectId = c.req.param("projectId");
    const data = c.req.valid("json");
    const annotation = await annotationService.create(projectId, userId, data);
    return c.json({ annotation }, 201);
  },
);
