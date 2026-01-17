import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth";
import { extensionAuthRoutes } from "./routes/extension-auth";
import { workspaceRoutes } from "./routes/workspaces";
import { projectRoutes } from "./routes/projects";
import { annotationRoutes } from "./routes/annotations";
import { uploadRoutes } from "./routes/upload";
import { integrationRoutes } from "./routes/integrations";
import { errorHandler } from "./middleware/error-handler";

// Create Hono app with /api base path
const app = new Hono().basePath("/api");

// Global middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return "http://localhost:3000";

      // Allow localhost for development
      if (
        origin === "http://localhost:3000" ||
        origin === "http://localhost:3001"
      )
        return origin;

      // Allow production web app
      if (origin === "https://nottto-web.vercel.app") return origin;

      // Allow any Chrome extension (background script requests)
      if (origin.startsWith("chrome-extension://")) return origin;

      // In development, allow any origin for testing
      if (process.env.NODE_ENV !== "production") {
        return origin;
      }

      // Default: return null to reject other origins in production
      return null;
    },
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Set-Cookie"],
  }),
);

// Error handler
app.onError(errorHandler);

// Health check at /api
app.get("/", (c) => c.json({ status: "ok", service: "nottto-api" }));

// Routes
app.route("/auth", authRoutes);
app.route("/extension-auth", extensionAuthRoutes);
app.route("/workspaces", workspaceRoutes);
app.route("/projects", projectRoutes);
app.route("/annotations", annotationRoutes);
app.route("/upload", uploadRoutes);
app.route("/projects", integrationRoutes);

// 404 handler
app.notFound((c) =>
  c.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, 404),
);

// Vercel serverless exports
const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = handler;

export default app;
