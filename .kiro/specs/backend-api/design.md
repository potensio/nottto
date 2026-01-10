# Design Document: Nottto Backend API

## Overview

This document describes the architecture and implementation design for the Nottto Backend API. The API is built using Hono framework running on Bun, with Drizzle ORM connecting to Neon PostgreSQL, and Vercel Blob for file storage. The system provides authentication, workspace/project management, and annotation storage for the Nottto Chrome extension.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Chrome Extension                             │
│                  (Authorization: Bearer <token>)                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Hono API (Bun)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Auth Routes  │  │ CRUD Routes  │  │ Upload Routes        │   │
│  │ /auth/*      │  │ /workspaces  │  │ /upload/screenshot   │   │
│  │              │  │ /projects    │  │                      │   │
│  │              │  │ /annotations │  │                      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                      │               │
│  ┌──────▼─────────────────▼──────────────────────▼───────────┐  │
│  │                    Middleware Layer                        │  │
│  │  • JWT Validation  • Zod Validation  • Error Handling     │  │
│  └──────────────────────────┬────────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Neon Postgres  │  │  Vercel Blob    │  │  jose (JWT)     │
│  (Drizzle ORM)  │  │  (Screenshots)  │  │  bcryptjs       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Components and Interfaces

### 1. Application Entry Point

The main Hono application that registers all routes and middleware.

```typescript
// apps/api/src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth";
import { workspaceRoutes } from "./routes/workspaces";
import { projectRoutes } from "./routes/projects";
import { annotationRoutes } from "./routes/annotations";
import { uploadRoutes } from "./routes/upload";
import { errorHandler } from "./middleware/error-handler";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());
app.onError(errorHandler);

app.route("/auth", authRoutes);
app.route("/workspaces", workspaceRoutes);
app.route("/projects", projectRoutes);
app.route("/annotations", annotationRoutes);
app.route("/upload", uploadRoutes);

export default app;
```

### 2. Authentication Middleware

Custom JWT verification middleware using jose library.

```typescript
// apps/api/src/middleware/auth.ts
import { Context, Next } from "hono";
import { jwtVerify } from "jose";
import { HTTPException } from "hono/http-exception";

interface JWTPayload {
  sub: string;
  email: string;
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPException(401, {
      message: "Missing or invalid authorization header",
    });
  }

  const token = authHeader.slice(7);
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    c.set("userId", payload.sub);
    c.set("userEmail", payload.email);
    await next();
  } catch {
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }
}
```

### 3. Auth Service

Handles user registration, login, and token management.

```typescript
// apps/api/src/services/auth.ts
interface AuthService {
  register(
    email: string,
    password: string,
    name?: string
  ): Promise<AuthResponse>;
  login(email: string, password: string): Promise<AuthResponse>;
  refresh(refreshToken: string): Promise<{ accessToken: string }>;
  getUser(userId: string): Promise<User | null>;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
```

### 4. Workspace Service

Manages workspace CRUD operations with ownership validation.

```typescript
// apps/api/src/services/workspaces.ts
interface WorkspaceService {
  list(userId: string): Promise<Workspace[]>;
  create(userId: string, data: CreateWorkspaceInput): Promise<Workspace>;
  get(workspaceId: string, userId: string): Promise<Workspace>;
  update(
    workspaceId: string,
    userId: string,
    data: UpdateWorkspaceInput
  ): Promise<Workspace>;
  delete(workspaceId: string, userId: string): Promise<void>;
}
```

### 5. Project Service

Manages project CRUD within workspaces.

```typescript
// apps/api/src/services/projects.ts
interface ProjectService {
  list(workspaceId: string, userId: string): Promise<Project[]>;
  create(
    workspaceId: string,
    userId: string,
    data: CreateProjectInput
  ): Promise<Project>;
  get(projectId: string, userId: string): Promise<Project>;
  update(
    projectId: string,
    userId: string,
    data: UpdateProjectInput
  ): Promise<Project>;
  delete(projectId: string, userId: string): Promise<void>;
}
```

### 6. Annotation Service

Manages annotation CRUD with project access validation.

```typescript
// apps/api/src/services/annotations.ts
interface AnnotationService {
  list(projectId: string, userId: string): Promise<Annotation[]>;
  create(
    projectId: string,
    userId: string,
    data: CreateAnnotationInput
  ): Promise<Annotation>;
  get(annotationId: string, userId: string): Promise<Annotation>;
  update(
    annotationId: string,
    userId: string,
    data: UpdateAnnotationInput
  ): Promise<Annotation>;
  delete(annotationId: string, userId: string): Promise<void>;
}
```

### 7. Upload Service

Handles screenshot uploads to Vercel Blob.

```typescript
// apps/api/src/services/upload.ts
interface UploadService {
  uploadScreenshot(file: File, userId: string): Promise<{ url: string }>;
}
```

## Data Models

### Database Schema (Drizzle)

```typescript
// packages/shared/src/db/schema.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workspaceMembers = pgTable("workspace_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  role: varchar("role", { length: 50 }).default("member").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const annotations = pgTable("annotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }),
  priority: varchar("priority", { length: 50 }),
  pageUrl: text("page_url"),
  pageTitle: varchar("page_title", { length: 255 }),
  screenshotOriginal: text("screenshot_original"),
  screenshotAnnotated: text("screenshot_annotated"),
  canvasData: jsonb("canvas_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Zod Validation Schemas

```typescript
// packages/shared/src/schemas/auth.ts
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// packages/shared/src/schemas/workspace.ts
export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
});

// packages/shared/src/schemas/project.ts
export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

// packages/shared/src/schemas/annotation.ts
export const createAnnotationSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(["bug", "improvement", "question"]).optional(),
  priority: z.enum(["urgent", "high", "medium", "low"]).optional(),
  pageUrl: z.string().url().optional(),
  pageTitle: z.string().max(255).optional(),
  screenshotOriginal: z.string().url().optional(),
  screenshotAnnotated: z.string().url().optional(),
  canvasData: z.any().optional(),
});

export const updateAnnotationSchema = createAnnotationSchema.partial();
```

### TypeScript Types

```typescript
// packages/shared/src/types/index.ts
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Annotation {
  id: string;
  projectId: string;
  userId: string | null;
  title: string;
  description: string | null;
  type: "bug" | "improvement" | "question" | null;
  priority: "urgent" | "high" | "medium" | "low" | null;
  pageUrl: string | null;
  pageTitle: string | null;
  screenshotOriginal: string | null;
  screenshotAnnotated: string | null;
  canvasData: unknown;
  createdAt: Date;
  updatedAt: Date;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Password hashing invariant

_For any_ user registration with a valid password, the stored password hash SHALL NOT equal the plaintext password, and bcrypt.compare(plaintext, hash) SHALL return true.
**Validates: Requirements 1.1, 7.3**

### Property 2: Registration creates complete user setup

_For any_ successful user registration, the system SHALL create a user record, a default workspace, and a default project within that workspace atomically.
**Validates: Requirements 1.2, 1.3, 8.3**

### Property 3: Authentication token round-trip

_For any_ valid user credentials, logging in SHALL return tokens that can be used to access protected endpoints, and the /auth/me endpoint SHALL return the same user who logged in.
**Validates: Requirements 2.1, 2.5**

### Property 4: Refresh token produces valid access token

_For any_ valid refresh token, calling the refresh endpoint SHALL return a new access token that grants access to protected endpoints.
**Validates: Requirements 2.3**

### Property 5: Workspace ownership authorization

_For any_ workspace and user, the user SHALL only be able to read, update, or delete the workspace if they are the owner or a member.
**Validates: Requirements 3.1, 3.3, 3.4, 3.5, 3.6**

### Property 6: Slug generation uniqueness

_For any_ workspace or project creation with a valid name, the system SHALL generate a slug that is unique within its scope (global for workspaces, per-workspace for projects).
**Validates: Requirements 3.2, 4.2**

### Property 7: Workspace cascade deletion

_For any_ workspace deletion, all projects belonging to that workspace AND all annotations belonging to those projects SHALL be deleted.
**Validates: Requirements 3.5, 8.4**

### Property 8: Project ownership through workspace

_For any_ project operation, the user SHALL only have access if they own or are a member of the project's parent workspace.
**Validates: Requirements 4.1, 4.3, 4.4, 4.5, 4.6**

### Property 9: Project cascade deletion

_For any_ project deletion, all annotations belonging to that project SHALL be deleted.
**Validates: Requirements 4.5, 8.5**

### Property 10: Annotation user association

_For any_ annotation creation, the annotation SHALL be associated with the creating user's ID.
**Validates: Requirements 5.2**

### Property 11: Annotation metadata preservation

_For any_ annotation with metadata (type, priority, pageUrl, pageTitle, screenshots, canvasData), retrieving the annotation SHALL return all stored metadata unchanged.
**Validates: Requirements 5.3, 5.7, 6.4**

### Property 12: Protected endpoints require authentication

_For any_ endpoint except /auth/register and /auth/login, requests without a valid access token SHALL receive a 401 response.
**Validates: Requirements 7.1**

### Property 13: Input validation rejects invalid data

_For any_ request with invalid input (invalid email format, short password, missing required fields), the API SHALL return a 400 validation error.
**Validates: Requirements 1.6, 1.7, 7.5**

### Property 14: Error responses hide internal details

_For any_ internal error (database failure, unexpected exception), the API response SHALL NOT contain stack traces, SQL queries, or internal system information.
**Validates: Requirements 8.2**

## Error Handling

### HTTP Status Codes

| Status | Usage                                |
| ------ | ------------------------------------ |
| 200    | Successful GET, PATCH                |
| 201    | Successful POST (resource created)   |
| 204    | Successful DELETE                    |
| 400    | Validation error (invalid input)     |
| 401    | Unauthorized (missing/invalid token) |
| 403    | Forbidden (no access to resource)    |
| 404    | Resource not found                   |
| 409    | Conflict (duplicate email/slug)      |
| 413    | Payload too large (file upload)      |
| 500    | Internal server error                |

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, string[]>  // For validation errors
  }
}

// Example validation error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "email": ["Invalid email format"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}

// Example auth error
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### Error Handler Middleware

```typescript
// apps/api/src/middleware/error-handler.ts
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export function errorHandler(err: Error, c: Context) {
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: {
          code: getErrorCode(err.status),
          message: err.message,
        },
      },
      err.status
    );
  }

  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: formatZodErrors(err),
        },
      },
      400
    );
  }

  // Log internal errors but don't expose details
  console.error("Internal error:", err);
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    500
  );
}
```

## Testing Strategy

### Testing Framework

- **Unit Tests**: Bun's built-in test runner (`bun test`)
- **Property-Based Tests**: fast-check library
- **Integration Tests**: Supertest with in-memory database or test database

### Unit Tests

Unit tests verify specific examples and edge cases:

- Auth service: password hashing, token generation/verification
- Slug generation: various input strings, collision handling
- Validation schemas: valid/invalid inputs for each schema
- Error formatting: Zod errors, HTTP exceptions

### Property-Based Tests

Property tests verify universal properties across generated inputs:

- Each property from the Correctness Properties section gets a dedicated test
- Minimum 100 iterations per property test
- Use fast-check for generating random valid inputs
- Tag format: `Feature: backend-api, Property N: [property description]`

### Test Configuration

```typescript
// apps/api/test/setup.ts
import { fc } from "fast-check";

// Configure fast-check for 100+ iterations
fc.configureGlobal({ numRuns: 100 });

// Generators for domain types
export const emailArb = fc.emailAddress();
export const passwordArb = fc.string({ minLength: 8, maxLength: 72 });
export const nameArb = fc.string({ minLength: 1, maxLength: 255 });
export const slugArb = fc
  .string({ minLength: 1, maxLength: 255 })
  .filter((s) => /^[a-z0-9-]+$/.test(s));
```

### Integration Tests

Integration tests verify end-to-end flows:

- Registration → Login → Create workspace → Create project → Create annotation
- Authorization: verify 403 for unauthorized access attempts
- Cascade deletion: verify related records are deleted

### Test Database Strategy

- Use a separate Neon database branch for testing
- Reset database state before each test suite
- Use transactions with rollback for individual test isolation
