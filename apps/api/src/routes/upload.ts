import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { authMiddleware } from "../middleware/auth";
import * as uploadService from "../services/upload";

export const uploadRoutes = new Hono();

// All upload routes require authentication
uploadRoutes.use("*", authMiddleware);

// POST /upload/screenshot - Upload screenshot to Vercel Blob
uploadRoutes.post("/screenshot", async (c) => {
  const userId = c.get("userId");

  const body = await c.req.parseBody();
  const file = body["file"];

  if (!file || !(file instanceof File)) {
    throw new HTTPException(400, { message: "No file provided" });
  }

  const result = await uploadService.uploadScreenshot(file, userId);
  return c.json(result, 201);
});
