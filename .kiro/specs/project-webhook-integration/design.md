# Design Document: Project Webhook Integration

## Overview

This design describes the UI implementation for project-level webhook integrations. Users can configure a webhook endpoint with custom URL, headers, and a JSON body template that supports variable substitution. When an annotation is created, the system will send a POST request to the configured endpoint with the templated payload.

The UI will be added as a new settings page accessible from the project detail page, following the existing design patterns in the application.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Project Settings Page                         │
│  /dashboard/[workspaceSlug]/projects/[projectSlug]/settings     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Integration Toggle (Enable/Disable)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Webhook URL Input                                        │   │
│  │  [https://api.linear.app/graphql                    ]     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Headers Configuration                                    │   │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐    │   │
│  │  │ Authorization   │  │ Bearer lin_api_xxx          │ ✕  │   │
│  │  └─────────────────┘  └─────────────────────────────┘    │   │
│  │  [+ Add Header]                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────┬─────────────────────────────┐   │
│  │  Body Template Editor      │  Available Variables        │   │
│  │  ┌──────────────────────┐  │  {{title}}                  │   │
│  │  │ {                    │  │  {{description}}            │   │
│  │  │   "title": "{{title}}│  │  {{url}}                    │   │
│  │  │   ...                │  │  {{screenshot_url}}         │   │
│  │  │ }                    │  │  {{page_title}}             │   │
│  │  └──────────────────────┘  │  {{priority}}               │   │
│  │                            │  {{type}}                   │   │
│  │  ⚠ JSON validation error   │  {{created_by.name}}        │   │
│  │                            │  {{created_by.email}}       │   │
│  └────────────────────────────┴─────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  [Test Webhook]                    [Save Configuration]   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Page Component

**File:** `apps/web/src/app/dashboard/[workspaceSlug]/projects/[projectSlug]/settings/page.tsx`

```typescript
interface ProjectSettingsPageProps {
  params: {
    workspaceSlug: string;
    projectSlug: string;
  };
}
```

### Integration Form Component

**File:** `apps/web/src/components/dashboard/IntegrationForm.tsx`

```typescript
interface IntegrationFormProps {
  projectId: string;
  initialData?: WebhookIntegration | null;
  onSave: (data: WebhookIntegrationInput) => Promise<void>;
  onTest: (data: WebhookIntegrationInput) => Promise<TestResult>;
}

interface WebhookIntegration {
  id: string;
  projectId: string;
  url: string;
  headers: Record<string, string>;
  bodyTemplate: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WebhookIntegrationInput {
  url: string;
  headers: Record<string, string>;
  bodyTemplate: string;
  enabled: boolean;
}

interface TestResult {
  success: boolean;
  statusCode?: number;
  message: string;
}
```

### Header Editor Component

**File:** `apps/web/src/components/dashboard/HeaderEditor.tsx`

```typescript
interface HeaderEditorProps {
  headers: HeaderEntry[];
  onChange: (headers: HeaderEntry[]) => void;
}

interface HeaderEntry {
  id: string;
  key: string;
  value: string;
}
```

### Body Template Editor Component

**File:** `apps/web/src/components/dashboard/BodyTemplateEditor.tsx`

```typescript
interface BodyTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}
```

### Variable Reference Panel Component

**File:** `apps/web/src/components/dashboard/VariableReferencePanel.tsx`

```typescript
interface VariableInfo {
  name: string;
  description: string;
  example: string;
}

interface VariableReferencePanelProps {
  variables: VariableInfo[];
}
```

## Data Models

### Available Template Variables

| Variable               | Description                           | Example Value                   |
| ---------------------- | ------------------------------------- | ------------------------------- |
| `{{title}}`            | Annotation title                      | "Button misaligned on mobile"   |
| `{{description}}`      | Annotation description                | "The submit button overlaps..." |
| `{{url}}`              | Page URL where annotation was created | "https://example.com/checkout"  |
| `{{screenshot_url}}`   | URL to the annotated screenshot       | "https://cdn.app.com/..."       |
| `{{page_title}}`       | Title of the page                     | "Checkout - Example Store"      |
| `{{priority}}`         | Priority level                        | "high", "medium", "low"         |
| `{{type}}`             | Annotation type                       | "bug", "feedback", "suggestion" |
| `{{created_by.name}}`  | Name of the user who created it       | "John Doe"                      |
| `{{created_by.email}}` | Email of the creator                  | "john@agency.com"               |
| `{{project.name}}`     | Project name                          | "Client ABC Website"            |
| `{{created_at}}`       | ISO timestamp of creation             | "2026-01-12T14:30:00Z"          |

### Form State

```typescript
interface IntegrationFormState {
  url: string;
  headers: HeaderEntry[];
  bodyTemplate: string;
  enabled: boolean;
  urlError: string | null;
  bodyError: string | null;
  isSaving: boolean;
  isTesting: boolean;
  testResult: TestResult | null;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: URL Validation Correctness

_For any_ input string provided as a webhook URL, the URL validator SHALL accept it if and only if it is a valid HTTPS URL (starts with `https://` and has valid URL structure).

**Validates: Requirements 1.2**

### Property 2: Integration Configuration Round-Trip

_For any_ valid webhook integration configuration (URL, headers, body template, enabled state), saving the configuration and then retrieving it SHALL return an equivalent configuration object.

**Validates: Requirements 1.5**

### Property 3: JSON Body Template Validation

_For any_ string input as a body template, the JSON validator SHALL reject it if and only if it is not valid JSON syntax (after temporarily removing `{{variable}}` placeholders for validation).

**Validates: Requirements 2.3**

### Property 4: Variable Substitution Completeness

_For any_ body template containing supported variable placeholders and any valid annotation data object, the template substitution function SHALL replace all supported variables (`{{title}}`, `{{description}}`, `{{url}}`, `{{screenshot_url}}`, `{{page_title}}`, `{{priority}}`, `{{type}}`, `{{created_by.name}}`, `{{created_by.email}}`, `{{project.name}}`, `{{created_at}}`) with their corresponding values from the annotation data.

**Validates: Requirements 2.4**

## Error Handling

### URL Validation Errors

- Display inline error message below URL input field
- Error message: "Please enter a valid HTTPS URL"
- Prevent form submission until URL is valid

### JSON Validation Errors

- Display inline error message below body template textarea
- Show specific JSON parse error message (e.g., "Unexpected token at position 45")
- Highlight the textarea border in red

### Test Webhook Errors

- Display error toast/banner with failure reason
- Show HTTP status code if available (e.g., "Request failed with status 401")
- Show network error message for connection failures

### Save Errors

- Display error toast/banner with failure reason
- Keep form data intact for retry
- Re-enable save button after error

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **URL Validation**

   - Valid HTTPS URLs are accepted
   - HTTP URLs are rejected
   - Invalid URL formats are rejected
   - Empty strings are rejected

2. **JSON Validation**

   - Valid JSON is accepted
   - JSON with variable placeholders is accepted
   - Invalid JSON syntax is rejected
   - Empty body template is handled

3. **Header Editor**

   - Adding headers works correctly
   - Removing headers works correctly
   - Empty header keys/values are handled

4. **Component Rendering**
   - Form renders with all required fields
   - Variable reference panel displays all variables
   - Toggle state is reflected in UI

### Property-Based Tests

Property-based tests will use a testing library (e.g., fast-check) to verify universal properties:

1. **URL Validation Property** - Generate random strings and verify validation correctness
2. **JSON Validation Property** - Generate random strings and verify JSON detection
3. **Variable Substitution Property** - Generate random annotation data and verify all variables are substituted

Each property test should run minimum 100 iterations to ensure comprehensive coverage.

**Testing Framework:** Vitest with fast-check for property-based testing
