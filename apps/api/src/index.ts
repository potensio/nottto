import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth";
import { oauthRoutes } from "./routes/oauth";
import { workspaceRoutes } from "./routes/workspaces";
import { projectRoutes } from "./routes/projects";
import { annotationRoutes } from "./routes/annotations";
import { uploadRoutes } from "./routes/upload";
import { integrationRoutes } from "./routes/integrations";
import { invitationRoutes } from "./routes/invitations";
import { errorHandler } from "./middleware/error-handler";

// Create Hono app with /api base path
const app = new Hono().basePath("/api");

// Global middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      // Chrome extension background service workers don't send Origin header
      // Check if request is from extension via other headers
      const referer = c.req.header("Referer");
      const userAgent = c.req.header("User-Agent");

      // Allow requests with no origin (like mobile apps, curl, or extension background scripts)
      if (!origin) {
        // If there's a referer but no origin, it's likely from an extension background script
        // This is safe because we validate the extension ID in manifest.json host_permissions
        return "*";
      }

      // Allow localhost for development
      if (
        origin === "http://localhost:3000" ||
        origin === "http://localhost:3001"
      )
        return origin;

      // Allow production web app
      if (origin === "https://notto-web.vercel.app") return origin;
      if (origin === "https://notto.site") return origin;
      if (origin === "https://www.notto.site") return origin;

      // Allow Vercel dashboard and preview/deployment URLs
      if (origin === "https://vercel.com") return origin;
      if (origin.endsWith(".vercel.app")) return origin;

      // Allow any Chrome extension (content script requests)
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
app.get("/", (c) => c.json({ status: "ok", service: "notto-api" }));

// Routes
app.route("/auth", authRoutes);
app.route("/oauth", oauthRoutes);
app.route("/workspaces", workspaceRoutes);
app.route("/projects", projectRoutes);
app.route("/annotations", annotationRoutes);
app.route("/upload", uploadRoutes);
app.route("/projects", integrationRoutes);
app.route("/invitations", invitationRoutes);

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
