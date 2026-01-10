# Nottto API

Backend API for the Nottto Chrome extension, built with Hono, Drizzle ORM, and Neon PostgreSQL.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle
- **File Storage**: Vercel Blob
- **Auth**: JWT (jose) + bcrypt

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- [Neon](https://neon.tech/) PostgreSQL database
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) storage (for screenshots)

### Environment Setup

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Fill in your environment variables:
   ```env
   DATABASE_URL=postgresql://user:password@host.neon.tech/nottto?sslmode=require
   JWT_SECRET=your-jwt-secret-key-min-32-chars
   JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
   BLOB_READ_WRITE_TOKEN=vercel_blob_...
   ```

### Database Setup

1. Generate migrations:

   ```bash
   bun run db:generate
   ```

2. Apply migrations:
   ```bash
   bun run db:push
   ```

### Development

```bash
bun run dev
```

The API will be available at `http://localhost:3001`.

### Build

```bash
bun run build
```

## API Endpoints

### Auth

- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user (protected)

### Workspaces

- `GET /workspaces` - List workspaces (protected)
- `POST /workspaces` - Create workspace (protected)
- `GET /workspaces/:id` - Get workspace (protected)
- `PATCH /workspaces/:id` - Update workspace (protected)
- `DELETE /workspaces/:id` - Delete workspace (protected)

### Projects

- `GET /workspaces/:workspaceId/projects` - List projects (protected)
- `POST /workspaces/:workspaceId/projects` - Create project (protected)
- `GET /projects/:id` - Get project (protected)
- `PATCH /projects/:id` - Update project (protected)
- `DELETE /projects/:id` - Delete project (protected)

### Annotations

- `GET /projects/:projectId/annotations` - List annotations (protected)
- `POST /projects/:projectId/annotations` - Create annotation (protected)
- `GET /annotations/:id` - Get annotation (protected)
- `PATCH /annotations/:id` - Update annotation (protected)
- `DELETE /annotations/:id` - Delete annotation (protected)

### Upload

- `POST /upload/screenshot` - Upload screenshot (protected)

## Deployment

Deploy to Vercel:

```bash
vercel deploy
```

Make sure to set all environment variables in your Vercel project settings.
