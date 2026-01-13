# Design Document: Webhook Integration Backend

## Overview

This design describes the backend implementation for project-level webhook integrations. It includes a new database table for storing configurations, API routes for CRUD operations, and a webhook executor service that fires when annotations are created.

The implementation follows existing patterns in the codebase: Hono for routing, Drizzle ORM for database access, and Zod for validation.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│                    (IntegrationForm)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes                                  │
│  GET/PUT/DELETE /projects/:projectId/integration                │
│  POST /projects/:projectId/integration/test                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Integration Service                            │
│  - get(projectId, userId)                                       │
│  - upsert(projectId, userId, data)                              │
│  - remove(projectId, userId)                                    │
│  - test(projectId, userId, data)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│      Database           │     │   Webhook Executor      │
│  (webhookIntegrations)  │     │  - execute(integration, │
│                         │     │    annotationData)      │
└─────────────────────────┘     └─────────────────────────┘
```

## Components and Interfaces

### Database Schema

**File:** `packages/shared/src/db/schema.ts`

```typescript
export const webhookIntegrations = pgTable("webhook_integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  url: text("url").notNull(),
  headers: jsonb("headers").default({}).notNull(),
  bodyTemplate: text("body_template").default("").notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  locked: boolean("locked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### API Routes

**File:** `apps/api/src/routes/integrations.ts`

```typescript
// GET /projects/:projectId/integration
// Returns the integration config or null if not configured

// PUT /projects/:projectId/integration
// Creates or updates the integration config
// Body: { url, headers, bodyTemplate, enabled, locked }

// DELETE /projects/:projectId/integration
// Removes the integration config

// POST /projects/:projectId/integration/test
// Sends a test webhook with sample data
// Body: { url, headers, bodyTemplate }
// Returns: { success, statusCode?, message }
```

### Integration Service

**File:** `apps/api/src/services/integrations.ts`

```typescript
interface WebhookIntegration {
  id: string;
  projectId: string;
  url: string;
  headers: Record<string, string>;
  bodyTemplate: string;
  enabled: boolean;
  locked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface WebhookIntegrationInput {
  url: string;
  headers: Record<string, string>;
  bodyTemplate: string;
  enabled: boolean;
  locked: boolean;
}

interface TestResult {
  success: boolean;
  statusCode?: number;
  message: string;
}

// Service functions
async function get(
  projectId: string,
  userId: string
): Promise<WebhookIntegration | null>;
async function upsert(
  projectId: string,
  userId: string,
  data: WebhookIntegrationInput
): Promise<WebhookIntegration>;
async function remove(projectId: string, userId: string): Promise<void>;
async function test(
  projectId: string,
  userId: string,
  data: WebhookIntegrationInput
): Promise<TestResult>;
```

### Webhook Executor

**File:** `apps/api/src/services/webhook-executor.ts`

```typescript
interface AnnotationData {
  id: string;
  title: string;
  description?: string;
  pageUrl?: string;
  pageTitle?: string;
  screenshotAnnotated?: string;
  priority?: string;
  type?: string;
  createdBy: { name: string; email: string };
  project: { name: string };
  createdAt: string;
}

// Execute webhook for an annotation
async function executeWebhook(
  integration: WebhookIntegration,
  annotationData: AnnotationData
): Promise<void>;

// Substitute variables in template
function substituteVariables(template: string, data: AnnotationData): string;
```

## Data Models

### Webhook Integration Record

| Field        | Type      | Description                      |
| ------------ | --------- | -------------------------------- |
| id           | UUID      | Primary key                      |
| projectId    | UUID      | Foreign key to projects (unique) |
| url          | TEXT      | Webhook endpoint URL             |
| headers      | JSONB     | Custom HTTP headers              |
| bodyTemplate | TEXT      | JSON template with {{variables}} |
| enabled      | BOOLEAN   | Whether webhook is active        |
| locked       | BOOLEAN   | Whether config is locked         |
| createdAt    | TIMESTAMP | Creation timestamp               |
| updatedAt    | TIMESTAMP | Last update timestamp            |

### Sample Test Payload

```json
{
  "title": "Sample Annotation",
  "description": "This is a test webhook payload",
  "url": "https://example.com/page",
  "screenshot_url": "https://cdn.example.com/screenshot.png",
  "page_title": "Example Page",
  "priority": "medium",
  "type": "bug",
  "created_by": {
    "name": "Test User",
    "email": "test@example.com"
  },
  "project": {
    "name": "Test Project"
  },
  "created_at": "2026-01-12T12:00:00Z"
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: One-to-One Project Integration Constraint

_For any_ project, attempting to create a second webhook integration SHALL fail with a unique constraint violation.

**Validates: Requirements 1.2**

### Property 2: Authorization Enforcement

_For any_ API request to integration endpoints, if the requesting user does not have access to the project, the API SHALL return 403 Forbidden.

**Validates: Requirements 2.5**

### Property 3: Webhook Fires on Annotation Creation

_For any_ annotation creation on a project with an enabled webhook integration, the system SHALL send a POST request to the configured URL.

**Validates: Requirements 4.1**

### Property 4: Webhook Failure Isolation

_For any_ annotation creation where the webhook request fails (network error, non-2xx response), the annotation SHALL still be created successfully.

**Validates: Requirements 4.5**

### Property 5: Locked Integration Rejects Updates

_For any_ update request to a locked integration (except for changing the lock state itself), the API SHALL return 403 Forbidden.

**Validates: Requirements 6.2**

## Error Handling

### Validation Errors (400)

- Invalid HTTPS URL: "URL must be a valid HTTPS URL"
- Invalid JSON template: "Body template must be valid JSON"
- Missing required fields: "URL is required"

### Authorization Errors (403)

- No project access: "Access denied to this project"
- Integration locked: "Integration is locked and cannot be modified"

### Not Found Errors (404)

- Project not found: "Project not found"
- Integration not found: "Integration not found" (for DELETE)

### Webhook Execution Errors

- Network errors: Logged but not returned to user
- Non-2xx responses: Logged with status code
- Timeout: Logged after 10 second timeout

## Testing Strategy

### Unit Tests

1. **Validation Functions**

   - URL validation accepts valid HTTPS URLs
   - URL validation rejects HTTP and invalid URLs
   - JSON template validation with placeholders

2. **Variable Substitution**

   - All variables are substituted correctly
   - Missing variables return empty string
   - Nested variables (created_by.name) work

3. **Service Functions**
   - get() returns null for non-existent integration
   - upsert() creates new integration
   - upsert() updates existing integration
   - remove() deletes integration
   - test() returns success/failure result

### Property-Based Tests

Property-based tests will use Vitest with fast-check:

1. **Authorization Property** - Generate random user/project combinations and verify access control
2. **Webhook Execution Property** - Generate random annotations and verify webhook fires
3. **Failure Isolation Property** - Generate failing webhook scenarios and verify annotation still created
4. **Lock Property** - Generate update requests on locked integrations and verify rejection

Each property test should run minimum 100 iterations.

**Testing Framework:** Vitest with fast-check for property-based testing

## Integration with Annotation Creation

The webhook execution will be integrated into the existing annotation creation flow:

```typescript
// In apps/api/src/services/annotations.ts - create function

export async function create(projectId, userId, data) {
  // ... existing annotation creation logic ...

  const annotation = await db.insert(annotations).values({...}).returning();

  // Fire webhook asynchronously (don't await, don't fail on error)
  fireWebhookIfEnabled(projectId, annotation).catch(err => {
    console.error('Webhook execution failed:', err);
  });

  return annotation;
}
```

This ensures:

1. Webhook is fired after successful annotation creation
2. Webhook failure doesn't block the response
3. Errors are logged for debugging
