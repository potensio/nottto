# Notto

A screenshot annotation tool with a Chrome extension and backend API for capturing, annotating, and managing bug reports.

## Project Structure

```
notto/
├── apps/
│   ├── api/              # Hono backend API
│   └── extension/        # Chrome extension
├── packages/
│   └── shared/           # Shared types, schemas, database
├── .kiro/                # Specs and documentation
├── package.json          # Root workspace config
└── pnpm-workspace.yaml   # pnpm workspace config
```

## Tech Stack

| Component    | Technology                          |
| ------------ | ----------------------------------- |
| Extension    | TypeScript, Fabric.js, Tailwind CSS |
| API          | Hono, Bun, Drizzle ORM              |
| Database     | Neon PostgreSQL                     |
| File Storage | Vercel Blob                         |
| Auth         | JWT (jose) + bcrypt                 |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) package manager
- [Bun](https://bun.sh/) runtime (for API)
- Chrome browser (for extension testing)

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run only the extension
pnpm dev:extension

# Run only the API
pnpm dev:api
```

### Building

```bash
# Build all apps
pnpm build

# Build only the extension
pnpm build:extension

# Build only the API
pnpm build:api
```

### Type Checking

```bash
pnpm typecheck
```

## Apps

### Chrome Extension (`apps/extension`)

Full-screen screenshot annotation tool with drawing capabilities.

**Features:**

- Full-screen annotation overlay
- Drawing tools: arrows, rectangles, ellipses, text
- Customizable colors and stroke weights
- Export annotated screenshots
- Keyboard shortcuts

**Loading in Chrome:**

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `apps/extension` directory

**Package for Chrome Web Store:**

```bash
cd apps/extension
npm run package
```

This creates a production-ready zip in `apps/extension/release/` with localhost permissions removed.

**Keyboard Shortcuts:**
| Key | Action |
|-----|--------|
| `A` | Arrow tool |
| `R` | Rectangle tool |
| `T` | Text tool |
| `Ctrl+Z` | Undo |
| `Ctrl+S` | Save |
| `Esc` | Cancel |

### Backend API (`apps/api`)

REST API for authentication, workspaces, projects, and annotation storage.

**Setup:**

1. Copy environment file:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
2. Fill in your credentials (Neon DB, JWT secrets, Vercel Blob)
3. Push database schema:
   ```bash
   pnpm db:push
   ```

**API Endpoints:**

- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user
- `GET/POST/PATCH/DELETE /workspaces` - Workspace CRUD
- `GET/POST/PATCH/DELETE /projects` - Project CRUD
- `GET/POST/PATCH/DELETE /annotations` - Annotation CRUD
- `POST /upload/screenshot` - Upload screenshot

See `apps/api/README.md` for full API documentation.

## Packages

### Shared (`packages/shared`)

Shared code used by both the extension and API:

- TypeScript types and interfaces
- Zod validation schemas
- Drizzle database schema

## Environment Variables

### API (`apps/api/.env`)

```env
DATABASE_URL=postgresql://...@neon.tech/notto
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
BLOB_READ_WRITE_TOKEN=vercel_blob_...
```

## Scripts

| Command              | Description                  |
| -------------------- | ---------------------------- |
| `pnpm dev`           | Run all apps in dev mode     |
| `pnpm build`         | Build all apps               |
| `pnpm typecheck`     | Type check all packages      |
| `pnpm dev:extension` | Run extension in dev mode    |
| `pnpm dev:api`       | Run API in dev mode          |
| `pnpm db:generate`   | Generate database migrations |
| `pnpm db:migrate`    | Run database migrations      |

## License

MIT
