# Design Document: Dashboard UI

## Overview

The Nottto Dashboard is a Next.js web application that provides users with a centralized interface to view and manage their annotated screenshots. The dashboard follows a workspace → project → annotation hierarchy, with a responsive sidebar layout that adapts to different screen sizes.

The design maintains visual consistency with the existing landing page and auth screens, using the established color palette (neutral tones with red accent), typography (Instrument Serif, Manrope, JetBrains Mono), and component patterns (glass panels, subtle shadows, animated backgrounds).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js App Router                       │
├─────────────────────────────────────────────────────────────────┤
│  /dashboard                                                      │
│  ├── layout.tsx (DashboardLayout with sidebar + header)         │
│  ├── page.tsx (workspace selector/redirect)                     │
│  └── [workspaceSlug]/                                           │
│      ├── layout.tsx (workspace context provider)                │
│      ├── page.tsx (workspace dashboard)                         │
│      ├── projects/[projectSlug]/page.tsx (project detail)       │
│      └── annotations/[id]/page.tsx (annotation detail)          │
├─────────────────────────────────────────────────────────────────┤
│                      Shared Components                           │
│  ├── DashboardHeader (logo, workspace selector, user menu)      │
│  ├── Sidebar (projects list, navigation)                        │
│  ├── AnnotationCard (thumbnail, metadata, click handler)        │
│  ├── AnnotationGrid (responsive grid of cards)                  │
│  ├── StatsBar (quick metrics display)                           │
│  ├── EmptyState (guidance for empty views)                      │
│  └── Skeletons (loading states)                                 │
├─────────────────────────────────────────────────────────────────┤
│                      Data Layer                                  │
│  ├── API Client (fetch wrapper with auth)                       │
│  ├── React Query hooks (data fetching + caching)                │
│  └── Auth Context (JWT token management)                        │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### DashboardLayout Component

The root layout for all dashboard pages, providing consistent structure.

```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Layout structure:
// ┌──────────────────────────────────────────┐
// │ Header (logo, workspace selector, user)  │
// ├────────────┬─────────────────────────────┤
// │            │                             │
// │  Sidebar   │      Main Content           │
// │  (projects)│      (children)             │
// │            │                             │
// └────────────┴─────────────────────────────┘
```

### DashboardHeader Component

```typescript
interface DashboardHeaderProps {
  currentWorkspace?: Workspace;
  workspaces: Workspace[];
  user: User;
  onWorkspaceChange: (workspaceId: string) => void;
  onLogout: () => void;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}
```

### Sidebar Component

```typescript
interface SidebarProps {
  projects: ProjectWithCount[];
  currentProjectSlug?: string;
  workspaceSlug: string;
  isCollapsed: boolean;
  onToggle: () => void;
}

interface ProjectWithCount {
  id: string;
  name: string;
  slug: string;
  annotationCount: number;
}
```

### AnnotationCard Component

```typescript
interface AnnotationCardProps {
  annotation: AnnotationSummary;
  onClick: () => void;
}

interface AnnotationSummary {
  id: string;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  type?: string;
  pageUrl?: string;
  pageTitle?: string;
  screenshotAnnotated?: string;
  createdAt: string;
  project: {
    name: string;
    slug: string;
  };
  user?: {
    name: string;
  };
}
```

### AnnotationGrid Component

```typescript
interface AnnotationGridProps {
  annotations: AnnotationSummary[];
  isLoading: boolean;
  onAnnotationClick: (id: string) => void;
}
```

### StatsBar Component

```typescript
interface StatsBarProps {
  totalAnnotations: number;
  thisWeekCount: number;
  highPriorityCount: number;
}
```

### EmptyState Component

```typescript
interface EmptyStateProps {
  type: "no-workspaces" | "no-projects" | "no-annotations";
  workspaceSlug?: string;
  onAction?: () => void;
}
```

## Data Models

### API Response Types

```typescript
// GET /workspaces
interface WorkspacesResponse {
  workspaces: Workspace[];
}

// GET /workspaces/:workspaceId/projects
interface ProjectsResponse {
  projects: Project[];
}

// GET /projects/:projectId/annotations
interface AnnotationsResponse {
  annotations: Annotation[];
}

// GET /annotations/:id
interface AnnotationDetailResponse {
  annotation: Annotation;
}
```

### Client-Side State

```typescript
interface DashboardState {
  currentWorkspaceId: string | null;
  sidebarCollapsed: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

Based on the prework analysis of acceptance criteria, the following testable properties have been identified:

**Property 1: Workspace selector visibility**
_For any_ user with N workspaces where N > 1, the workspace selector component SHALL be rendered in the header. _For any_ user with exactly 1 workspace, the selector SHALL NOT be rendered.
**Validates: Requirements 1.1, 1.2**

**Property 2: Workspace navigation URL generation**
_For any_ workspace with a valid slug, selecting that workspace SHALL result in navigation to the URL `/dashboard/{workspaceSlug}` where `{workspaceSlug}` matches the workspace's slug property.
**Validates: Requirements 1.3**

**Property 3: Annotation list ordering**
_For any_ list of annotations with length > 1, the displayed order SHALL satisfy: for all adjacent pairs (a, b), `a.createdAt >= b.createdAt` (descending order by creation date).
**Validates: Requirements 2.2**

**Property 4: Sidebar projects completeness**
_For any_ workspace with N projects, the sidebar SHALL display exactly N project entries, and each project's displayed annotation count SHALL equal the actual count of annotations in that project.
**Validates: Requirements 2.3, 4.1**

**Property 5: Annotation card data completeness**
_For any_ annotation object, the rendered AnnotationCard SHALL contain: (1) an image element with src matching screenshotAnnotated or a placeholder, (2) the title text, (3) the project name, (4) a formatted creation date.
**Validates: Requirements 3.1, 3.2, 3.3**

**Property 6: URL truncation**
_For any_ page URL string with length > 50 characters, the displayed URL in AnnotationCard SHALL be truncated to at most 50 characters followed by an ellipsis.
**Validates: Requirements 3.3**

**Property 7: Annotation detail metadata completeness**
_For any_ annotation object viewed in detail, the page SHALL render all non-null metadata fields: title, description, type, priority, pageUrl, and pageTitle.
**Validates: Requirements 5.2**

**Property 8: Responsive sidebar breakpoint**
_For any_ viewport width W, the sidebar visibility SHALL satisfy: visible when W >= 1024px, collapsed/hidden when W < 1024px.
**Validates: Requirements 6.1, 6.2**

**Property 9: Responsive grid columns**
_For any_ viewport width W, the annotation grid column count SHALL satisfy: 1 column when W < 640px, 2 columns when 640px <= W < 1024px, 3+ columns when W >= 1024px.
**Validates: Requirements 6.3**

**Property 10: Touch target minimum size**
_For any_ interactive element (button, link, clickable card) on mobile viewport (W < 768px), the element's clickable area SHALL have minimum dimensions of 44px × 44px.
**Validates: Requirements 6.4**

## Error Handling

### API Error Handling

```typescript
interface ApiError {
  status: number;
  message: string;
  code?: string;
}

// Error handling strategy:
// 401 Unauthorized → Redirect to /auth
// 403 Forbidden → Show access denied message
// 404 Not Found → Show 404 page
// 500+ Server Error → Show error with retry option
```

### Error UI States

1. **Network Error**: Display "Unable to connect. Check your internet connection." with retry button
2. **Auth Error**: Redirect to login with return URL preserved
3. **Not Found**: Display 404 page with navigation back to dashboard
4. **Server Error**: Display "Something went wrong" with retry button

### Loading States

Each data-dependent component has a corresponding skeleton:

- `AnnotationCardSkeleton`: Placeholder with animated pulse
- `SidebarSkeleton`: Project list placeholder
- `StatsBarSkeleton`: Stats placeholder

## Testing Strategy

### Unit Tests

Unit tests will verify individual component behavior:

- Component rendering with various props
- Event handler invocations
- Conditional rendering logic
- Edge cases (empty arrays, missing optional fields)

### Property-Based Tests

Property tests will verify universal properties using fast-check:

- Annotation sorting property (always newest first)
- URL generation consistency
- Responsive breakpoint logic

### Integration Tests

Integration tests will verify:

- Navigation flows between pages
- Data fetching and display
- Auth redirect behavior

### Test Configuration

- Framework: Vitest + React Testing Library
- Property testing: fast-check
- Minimum 100 iterations per property test
- Tests co-located with components using `.test.tsx` suffix
