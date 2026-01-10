# Nottto Backend Project Plan

## Overview

Backend API for Nottto Chrome extension, supporting authentication, workspaces, projects, and annotation storage.

## Tech Stack

| Component    | Technology          |
| ------------ | ------------------- |
| Runtime      | Bun                 |
| Framework    | Hono                |
| Database     | Neon PostgreSQL     |
| ORM          | Drizzle             |
| File Storage | Vercel Blob         |
| Auth         | Custom JWT + bcrypt |
| Deployment   | Vercel              |

## Monorepo Structure

```
nottto/
├── apps/
│   ├── extension/        # Chrome extension (existing code)
│   ├── api/              # Hono backend (new)
│   └── web/              # Next.js auth/dashboard (future)
├── packages/
│   └── shared/           # Shared types, API schemas, constants
├── package.json
├── pnpm-workspace.yaml
└── turbo.json            # Optional: Turborepo config
```

## Database Schema

### Users

```sql
users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
)
```

### Workspaces

```sql
workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) UNIQUE NOT NULL,
  owner_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
)
```

### Workspace Members (for future multi-user support)

```sql
workspace_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  role         VARCHAR(50) DEFAULT 'member',  -- owner, admin, member
  created_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
)
```

### Projects

```sql
projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  slug         VARCHAR(255) NOT NULL,
  description  TEXT,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, slug)
)
```

### Annotations

```sql
annotations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  title               VARCHAR(255) NOT NULL,
  description         TEXT,
  type                VARCHAR(50),           -- bug, improvement, question
  priority            VARCHAR(50),           -- urgent, high, medium, low
  page_url            TEXT,
  page_title          VARCHAR(255),
  screenshot_original TEXT,                  -- Vercel Blob URL
  screenshot_annotated TEXT,                 -- Vercel Blob URL
  canvas_data         JSONB,                 -- Fabric.js canvas state
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
)
```

## API Endpoints

### Auth

| Method | Endpoint         | Description                                |
| ------ | ---------------- | ------------------------------------------ |
| POST   | `/auth/register` | Create account + first workspace + project |
| POST   | `/auth/login`    | Login, returns JWT                         |
| POST   | `/auth/refresh`  | Refresh access token                       |
| GET    | `/auth/me`       | Get current user                           |

### Workspaces

| Method | Endpoint          | Description            |
| ------ | ----------------- | ---------------------- |
| GET    | `/workspaces`     | List user's workspaces |
| POST   | `/workspaces`     | Create workspace       |
| GET    | `/workspaces/:id` | Get workspace details  |
| PATCH  | `/workspaces/:id` | Update workspace       |
| DELETE | `/workspaces/:id` | Delete workspace       |

### Projects

| Method | Endpoint                            | Description                |
| ------ | ----------------------------------- | -------------------------- |
| GET    | `/workspaces/:workspaceId/projects` | List projects in workspace |
| POST   | `/workspaces/:workspaceId/projects` | Create project             |
| GET    | `/projects/:id`                     | Get project details        |
| PATCH  | `/projects/:id`                     | Update project             |
| DELETE | `/projects/:id`                     | Delete project             |

### Annotations

| Method | Endpoint                           | Description                 |
| ------ | ---------------------------------- | --------------------------- |
| GET    | `/projects/:projectId/annotations` | List annotations in project |
| POST   | `/projects/:projectId/annotations` | Create annotation           |
| GET    | `/annotations/:id`                 | Get annotation details      |
| PATCH  | `/annotations/:id`                 | Update annotation           |
| DELETE | `/annotations/:id`                 | Delete annotation           |

### Upload

| Method | Endpoint             | Description                      |
| ------ | -------------------- | -------------------------------- |
| POST   | `/upload/screenshot` | Upload screenshot to Vercel Blob |

## Auth Flow

1. User visits web app (`app.nottto.com`) → signs up/logs in
2. On signup: create user + default workspace + default project
3. JWT token returned (access token + refresh token)
4. Web app stores token, passes to extension via:
   - URL redirect with token param, or
   - `chrome.storage.sync` if same origin
5. Extension stores token in `chrome.storage.sync`
6. Extension includes `Authorization: Bearer <token>` on API calls

## JWT Structure

**Access Token (short-lived, 15min):**

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Refresh Token (long-lived, 7 days):**

- Stored in httpOnly cookie on web app
- Extension stores in `chrome.storage.sync`

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...@neon.tech/nottto

# Auth
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Vercel Blob
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# App
API_URL=https://api.nottto.com
WEB_URL=https://app.nottto.com
```

## Extension Changes Required

1. Add `popup.html` with login status / redirect to web app
2. Store auth token in `chrome.storage.sync`
3. Add workspace/project selector in annotation panel
4. Modify `saveTask()` to POST to API instead of downloading
5. Add API client utility with auth header injection

## Implementation Phases

### Phase 1: Core Backend

- [ ] Set up monorepo structure
- [ ] Initialize Hono app with Bun
- [ ] Set up Drizzle + Neon connection
- [ ] Implement auth endpoints (register, login, refresh, me)
- [ ] Implement workspace CRUD
- [ ] Implement project CRUD
- [ ] Implement annotation CRUD
- [ ] Set up Vercel Blob upload

### Phase 2: Extension Integration

- [ ] Add popup.html with auth status
- [ ] Implement token storage
- [ ] Add workspace/project selector to annotation panel
- [ ] Replace local save with API save
- [ ] Handle auth errors (redirect to login)

### Phase 3: Web App (Future)

- [ ] Next.js app for auth pages
- [ ] Dashboard for viewing annotations
- [ ] Workspace/project management UI

## Dependencies (api package)

```json
{
  "dependencies": {
    "hono": "^4.x",
    "@hono/zod-validator": "^0.x",
    "drizzle-orm": "^0.x",
    "@neondatabase/serverless": "^0.x",
    "@vercel/blob": "^0.x",
    "bcryptjs": "^2.x",
    "jose": "^5.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "drizzle-kit": "^0.x",
    "@types/bcryptjs": "^2.x"
  }
}
```

## Notes

- Use `jose` for JWT (edge-compatible, unlike `jsonwebtoken`)
- Use `bcryptjs` for password hashing (pure JS, works everywhere)
- Use `@neondatabase/serverless` for edge-compatible Postgres driver
- Drizzle for type-safe queries with good DX
