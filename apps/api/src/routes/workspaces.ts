import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  createProjectSchema,
} from "@notto/shared";
import { authMiddleware } from "../middleware/auth";
import * as workspaceService from "../services/workspaces";
import * as projectService from "../services/projects";

export const workspaceRoutes = new Hono();

// All workspace routes require authentication
workspaceRoutes.use("*", authMiddleware);

// GET /workspaces - List user's workspaces
workspaceRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const workspaces = await workspaceService.list(userId);
  return c.json({ workspaces });
});

// POST /workspaces - Create workspace
workspaceRoutes.post(
  "/",
  zValidator("json", createWorkspaceSchema),
  async (c) => {
    const userId = c.get("userId");
    const data = c.req.valid("json");
    const workspace = await workspaceService.create(userId, data);
    return c.json({ workspace }, 201);
  },
);

// GET /workspaces/:id - Get workspace details
workspaceRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const workspaceId = c.req.param("id");
  const workspace = await workspaceService.get(workspaceId, userId);
  return c.json({ workspace });
});

// GET /workspaces/by-slug/:slug - Get workspace by slug
workspaceRoutes.get("/by-slug/:slug", async (c) => {
  const userId = c.get("userId");
  const slug = c.req.param("slug");
  const workspace = await workspaceService.getBySlug(slug, userId);
  return c.json({ workspace });
});

// PATCH /workspaces/:id - Update workspace
workspaceRoutes.patch(
  "/:id",
  zValidator("json", updateWorkspaceSchema),
  async (c) => {
    const userId = c.get("userId");
    const workspaceId = c.req.param("id");
    const data = c.req.valid("json");
    const workspace = await workspaceService.update(workspaceId, userId, data);
    return c.json({ workspace });
  },
);

// DELETE /workspaces/:id - Delete workspace
workspaceRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const workspaceId = c.req.param("id");
  await workspaceService.remove(workspaceId, userId);
  return c.body(null, 204);
});

// GET /workspaces/:workspaceId/projects - List projects in workspace
workspaceRoutes.get("/:workspaceId/projects", async (c) => {
  const userId = c.get("userId");
  const workspaceId = c.req.param("workspaceId");
  const projects = await projectService.list(workspaceId, userId);
  return c.json({ projects });
});

// POST /workspaces/:workspaceId/projects - Create project in workspace
workspaceRoutes.post(
  "/:workspaceId/projects",
  zValidator("json", createProjectSchema),
  async (c) => {
    const userId = c.get("userId");
    const workspaceId = c.req.param("workspaceId");
    const data = c.req.valid("json");
    const project = await projectService.create(workspaceId, userId, data);
    return c.json({ project }, 201);
  },
);
