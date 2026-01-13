import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import * as integrationService from "../services/integrations";

export const integrationRoutes = new Hono();

// Validation schema for webhook integration
const webhookIntegrationSchema = z.object({
  url: z.string().min(1, "URL is required"),
  headers: z.record(z.string()).default({}),
  bodyTemplate: z.string().default(""),
  enabled: z.boolean().default(true),
  locked: z.boolean().default(false),
});

// All integration routes require authentication
integrationRoutes.use("*", authMiddleware);

// GET /projects/:projectId/integration - Get integration for project
integrationRoutes.get("/:projectId/integration", async (c) => {
  const userId = c.get("userId");
  const projectId = c.req.param("projectId");
  const integration = await integrationService.get(projectId, userId);
  return c.json({ integration });
});

// PUT /projects/:projectId/integration - Create or update integration
integrationRoutes.put(
  "/:projectId/integration",
  zValidator("json", webhookIntegrationSchema),
  async (c) => {
    const userId = c.get("userId");
    const projectId = c.req.param("projectId");
    const data = c.req.valid("json");
    const integration = await integrationService.upsert(
      projectId,
      userId,
      data
    );
    return c.json({ integration });
  }
);

// DELETE /projects/:projectId/integration - Delete integration
integrationRoutes.delete("/:projectId/integration", async (c) => {
  const userId = c.get("userId");
  const projectId = c.req.param("projectId");
  await integrationService.remove(projectId, userId);
  return c.body(null, 204);
});

// POST /projects/:projectId/integration/test - Test webhook
integrationRoutes.post(
  "/:projectId/integration/test",
  zValidator("json", webhookIntegrationSchema),
  async (c) => {
    const userId = c.get("userId");
    const projectId = c.req.param("projectId");
    const data = c.req.valid("json");
    const result = await integrationService.test(projectId, userId, data);
    return c.json(result);
  }
);
