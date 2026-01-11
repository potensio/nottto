# Design Document: Extension User Header

## Overview

This design adds a header component to the Chrome extension's annotation form that displays the user's avatar with logout functionality, and relocates the workspace selector to create a cleaner, more organized interface. The implementation also reviews and improves the authentication flow to follow Chrome extension security best practices.

## Architecture

The feature introduces the following architectural changes:

1. **Form Header Component** - A new UI section at the top of the annotation form panel
2. **User Avatar Component** - Displays user profile image or initials with dropdown menu
3. **Enhanced Auth Listener** - Improved security for postMessage handling

```
┌─────────────────────────────────────────────────────────────┐
│                    Annotation Overlay                        │
├─────────────────────────────┬───────────────────────────────┤
│                             │  ┌─────────────────────────┐  │
│                             │  │      Form Header        │  │
│                             │  │ [Workspace ▼]  [Avatar] │  │
│      Canvas Area            │  └─────────────────────────┘  │
│                             │  ┌─────────────────────────┐  │
│                             │  │      Form Body          │  │
│                             │  │  - Title                │  │
│                             │  │  - Project              │  │
│                             │  │  - Type, Priority       │  │
│                             │  │  - Description          │  │
│                             │  └─────────────────────────┘  │
│                             │  ┌─────────────────────────┐  │
│                             │  │      Form Footer        │  │
│                             │  │  [Cancel]  [Save]       │  │
│                             │  └─────────────────────────┘  │
└─────────────────────────────┴───────────────────────────────┘
```

## Components and Interfaces

### 1. Form Header Component

Located in `apps/extension/src/content/form-header.ts`

```typescript
interface FormHeaderState {
  dropdownOpen: boolean;
}

// Creates the form header HTML with workspace selector and user avatar
function createFormHeader(user: User | null): string;

// Initializes event listeners for the header
function initFormHeader(): void;

// Cleans up event listeners
function cleanupFormHeader(): void;
```

### 2. User Avatar Component

Located in `apps/extension/src/content/user-avatar.ts`

```typescript
interface UserAvatarProps {
  user: User;
  size?: "sm" | "md" | "lg";
}

// Generates initials from user name or email
function getInitials(user: User): string;

// Creates avatar HTML - image or initials
function createUserAvatar(props: UserAvatarProps): string;

// Creates the dropdown menu HTML
function createAvatarDropdown(user: User): string;

// Handles avatar click to toggle dropdown
function handleAvatarClick(): void;

// Handles logout action
async function handleLogout(): Promise<void>;
```

### 3. Enhanced Auth Listener

Updates to `apps/extension/src/content/auth-listener.ts`

```typescript
// Whitelist of allowed origins for postMessage
const ALLOWED_ORIGINS: readonly string[] = [
  "http://localhost:3000",
  "https://nottto.com",
  "https://www.nottto.com",
  "https://app.nottto.com",
];

// Validates message origin against whitelist
function isAllowedOrigin(origin: string): boolean;

// Enhanced message handler with strict origin validation
async function handleAuthMessage(event: MessageEvent): Promise<void>;
```

### 4. Updated User Type

The User interface in `apps/extension/src/utils/auth-storage.ts` needs to include avatarUrl:

```typescript
interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
}
```

## Data Models

### User Data Flow

```
Web App (auth/verify)
    │
    │ postMessage (NOTTTO_AUTH_SUCCESS)
    ▼
Auth Listener (content script)
    │
    │ Validate origin
    │ Extract tokens + user
    ▼
chrome.storage.local
    │
    │ saveAuthState()
    ▼
Annotation Form
    │
    │ getUser()
    ▼
Form Header (displays avatar)
```

### Storage Schema

```typescript
// Keys in chrome.storage.local
{
  nottto_access_token: string;
  nottto_refresh_token: string;
  nottto_user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl?: string | null;
  };
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Origin Validation

_For any_ postMessage event received by the auth listener, the message SHALL only be processed if the event.origin is in the allowed origins whitelist; messages from any other origin SHALL be ignored.

**Validates: Requirements 1.1, 1.3**

### Property 2: Token Storage Round-Trip

_For any_ valid auth message containing tokens and user data, after saving to storage and retrieving, the retrieved data SHALL be equivalent to the original data.

**Validates: Requirements 1.2**

### Property 3: Initials Derivation

_For any_ User object, the getInitials function SHALL return:

- The first character of the name (uppercased) if name is non-null and non-empty
- The first character of the email (uppercased) if name is null or empty

**Validates: Requirements 2.3, 2.4**

### Property 4: Avatar Rendering

_For any_ User object, the avatar component SHALL:

- Display an img element with the avatarUrl if avatarUrl is present and non-empty
- Display initials in a colored circle if avatarUrl is null or empty

**Validates: Requirements 2.2, 2.3**

### Property 5: Logout Clears Auth State

_For any_ authenticated state, after calling handleLogout(), the auth storage SHALL contain no tokens and no user data.

**Validates: Requirements 3.2**

### Property 6: Dropdown Shows User Email

_For any_ User object, the avatar dropdown SHALL display the user's email address.

**Validates: Requirements 5.2**

## Error Handling

### Authentication Errors

| Error Condition                | Handling                           |
| ------------------------------ | ---------------------------------- |
| Invalid postMessage origin     | Silently ignore message            |
| Missing tokens in auth message | Log error, do not save             |
| Storage write failure          | Log error, show toast notification |
| Token refresh failure          | Clear auth state, show auth prompt |

### UI Errors

| Error Condition            | Handling                             |
| -------------------------- | ------------------------------------ |
| User data not available    | Show placeholder avatar with "?"     |
| Avatar image fails to load | Fall back to initials display        |
| Dropdown fails to render   | Log error, avatar click does nothing |

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Initials derivation edge cases**

   - User with single-character name
   - User with empty string name
   - User with null name
   - Email with special characters

2. **Avatar rendering edge cases**

   - User with valid avatarUrl
   - User with empty avatarUrl
   - User with null avatarUrl

3. **Origin validation edge cases**
   - Exact match origins
   - Subdomain variations
   - HTTP vs HTTPS

### Property-Based Tests

Property-based tests will use **fast-check** library for TypeScript to verify universal properties:

1. **Origin validation property** - Generate random origins and verify only whitelisted ones are accepted
2. **Initials derivation property** - Generate random user objects and verify initials are correctly derived
3. **Token storage round-trip property** - Generate random token/user combinations and verify storage integrity
4. **Logout clears state property** - Generate random auth states and verify complete cleanup

Each property test will run minimum 100 iterations to ensure comprehensive coverage.

### Integration Tests

1. **Auth flow integration** - Verify postMessage → storage → UI display flow
2. **Logout flow integration** - Verify logout → clear storage → close overlay flow
3. **Header layout integration** - Verify workspace selector and avatar positioning
