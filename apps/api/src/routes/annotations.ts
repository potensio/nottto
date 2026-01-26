import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { updateAnnotationSchema } from "@notto/shared";
import { authMiddleware } from "../middleware/auth";
import * as annotationService from "../services/annotations";

export const annotationRoutes = new Hono();

// All annotation routes require authentication
annotationRoutes.use("*", authMiddleware);

// GET /annotations/:id - Get annotation details
annotationRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const annotationId = c.req.param("id");
  const annotation = await annotationService.get(annotationId, userId);
  return c.json({ annotation });
});

// PATCH /annotations/:id - Update annotation
annotationRoutes.patch(
  "/:id",
  zValidator("json", updateAnnotationSchema),
  async (c) => {
    const userId = c.get("userId");
    const annotationId = c.req.param("id");
    const data = c.req.valid("json");
    const annotation = await annotationService.update(
      annotationId,
      userId,
      data,
    );
    return c.json({ annotation });
  },
);

// DELETE /annotations/:id - Delete annotation
annotationRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const annotationId = c.req.param("id");
  await annotationService.remove(annotationId, userId);
  return c.body(null, 204);
});
