# Design Document: Workspace Team Invitations

## Overview

This feature enables workspace owners to invite team members via email, manage pending invitations, and control team member roles and permissions. The design leverages existing authentication patterns (magic link tokens), email service infrastructure, and database schema (workspaceMembers table already exists).

The system follows a token-based invitation flow similar to the existing magic link authentication, ensuring security and consistency with established patterns. Invitations expire after 7 days and use cryptographically secure tokens stored as hashes in the database.

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Invitation Flow                              │
└─────────────────────────────────────────────────────────────────────┘

1. Workspace Owner → Send Invitation
   ↓
2. API validates workspace access & email uniqueness
   ↓
3. Create invitation record with hashed token
   ↓
4. Email Service sends invitation email with token link
   ↓
5. Invitee clicks link → Verify token
   ↓
6. If no account: Redirect to registration → Return to accept
   If has account: Show accept/decline page
   ↓
7. Accept → Add to workspaceMembers table
   Decline → Mark invitation as declined
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend (Next.js)                         │
│  ┌────────────────────┐  ┌────────────────────┐                    │
│  │ Team Management    │  │ Invitation Accept  │                    │
│  │ Page               │  │ Page               │                    │
│  │ - List members     │  │ - Verify token     │                    │
│  │ - Send invites     │  │ - Show workspace   │                    │
│  │ - Manage roles     │  │ - Accept/Decline   │                    │
│  └────────────────────┘  └────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓ HTTP/JSON
┌─────────────────────────────────────────────────────────────────────┐
│                         API Layer (Hono)                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ /api/workspaces/:id/invitations                                │ │
│  │  - POST   /          → Send invitation                         │ │
│  │  - GET    /          → List pending invitations                │ │
│  │  - DELETE /:inviteId → Cancel invitation                       │ │
│  │  - POST   /:inviteId/resend → Resend invitation                │ │
│  │                                                                 │ │
│  │ /api/workspaces/:id/members                                    │ │
│  │  - GET    /          → List team members                       │ │
│  │  - PATCH  /:memberId → Update member role                      │ │
│  │  - DELETE /:memberId → Remove member                           │ │
│  │                                                                 │ │
│  │ /api/invitations                                               │ │
│  │  - GET    /:token    → Verify and get invitation details       │ │
│  │  - POST   /:token/accept → Accept invitation                   │ │
│  │  - POST   /:token/decline → Decline invitation                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       Service Layer                                  │
│  ┌────────────────────┐  ┌────────────────────┐                    │
│  │ Invitation Service │  │ Email Service      │                    │
│  │ - Create invite    │  │ - Send invite email│                    │
│  │ - Verify token     │  │ (existing)         │                    │
│  │ - Accept/Decline   │  └────────────────────┘                    │
│  │ - List/Cancel      │                                             │
│  └────────────────────┘                                             │
│  ┌────────────────────┐                                             │
│  │ Member Service     │                                             │
│  │ - List members     │                                             │
│  │ - Update role      │                                             │
│  │ - Remove member    │                                             │
│  └────────────────────┘                                             │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Database (PostgreSQL)                           │
│  ┌────────────────────┐  ┌────────────────────┐                    │
│  │ workspace_invites  │  │ workspace_members  │                    │
│  │ (new table)        │  │ (existing)         │                    │
│  └────────────────────┘  └────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Database Schema

#### New Table: workspace_invitations

```typescript
export const workspaceInvitations = pgTable(
  "workspace_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    inviterUserId: uuid("inviter_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    inviteeEmail: varchar("invitee_email", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).default("member").notNull(),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    declinedAt: timestamp("declined_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_workspace_invitations_workspace_id").on(table.workspaceId),
    index("idx_workspace_invitations_email").on(table.inviteeEmail),
    index("idx_workspace_invitations_expires_at").on(table.expiresAt),
    // Prevent duplicate pending invitations
    unique("workspace_email_pending_unique").on(
      table.workspaceId,
      table.inviteeEmail,
      table.status,
    ),
  ],
);
```

**Status values**: `pending`, `accepted`, `declined`, `cancelled`

**Role values**: `owner`, `admin`, `member` (matches existing workspaceMembers.role)

### API Endpoints

#### Invitation Management (Owner Actions)

**POST /api/workspaces/:workspaceId/invitations**

- Auth: Required (workspace owner/admin)
- Body: `{ email: string, role: "admin" | "member" }`
- Response: `{ invitation: Invitation }`
- Validates: workspace access, email not already member, no pending invite

**GET /api/workspaces/:workspaceId/invitations**

- Auth: Required (workspace owner/admin)
- Response: `{ invitations: Invitation[] }`
- Returns: All pending invitations for workspace

**DELETE /api/workspaces/:workspaceId/invitations/:invitationId**

- Auth: Required (workspace owner/admin)
- Response: 204 No Content
- Marks invitation as cancelled

**POST /api/workspaces/:workspaceId/invitations/:invitationId/resend**

- Auth: Required (workspace owner/admin)
- Response: `{ invitation: Invitation }`
- Generates new token, updates expiry, sends new email

#### Member Management (Owner Actions)

**GET /api/workspaces/:workspaceId/members**

- Auth: Required (workspace member)
- Response: `{ members: WorkspaceMember[] }`
- Returns: All members with user details

**PATCH /api/workspaces/:workspaceId/members/:memberId**

- Auth: Required (workspace owner/admin)
- Body: `{ role: "admin" | "member" }`
- Response: `{ member: WorkspaceMember }`
- Validates: Cannot change own role, cannot change owner role

**DELETE /api/workspaces/:workspaceId/members/:memberId**

- Auth: Required (workspace owner/admin)
- Response: 204 No Content
- Validates: Cannot remove self, cannot remove owner

#### Invitation Acceptance (Invitee Actions)

**GET /api/invitations/:token**

- Auth: Optional (public endpoint)
- Response: `{ invitation: InvitationDetails, workspace: WorkspaceInfo }`
- Validates: Token exists, not expired, status is pending

**POST /api/invitations/:token/accept**

- Auth: Required (must be logged in)
- Response: `{ workspace: Workspace }`
- Validates: Token valid, email matches logged-in user
- Creates: workspaceMembers record, updates invitation status

**POST /api/invitations/:token/decline**

- Auth: Optional (can decline without account)
- Response: 204 No Content
- Updates: invitation status to declined

### Service Layer

#### InvitationService

```typescript
interface InvitationService {
  // Create and send invitation
  create(
    workspaceId: string,
    inviterUserId: string,
    inviteeEmail: string,
    role: MemberRole,
  ): Promise<Invitation>;

  // List pending invitations for workspace
  listPending(workspaceId: string, userId: string): Promise<Invitation[]>;

  // Cancel invitation
  cancel(invitationId: string, userId: string): Promise<void>;

  // Resend invitation (new token)
  resend(invitationId: string, userId: string): Promise<Invitation>;

  // Verify token and get invitation details
  verify(token: string): Promise<InvitationDetails>;

  // Accept invitation
  accept(token: string, userId: string): Promise<void>;

  // Decline invitation
  decline(token: string): Promise<void>;

  // Cleanup expired invitations (cron job)
  cleanupExpired(): Promise<void>;
}
```

#### MemberService

```typescript
interface MemberService {
  // List all members of workspace
  list(workspaceId: string, userId: string): Promise<WorkspaceMemberWithUser[]>;

  // Update member role
  updateRole(
    workspaceId: string,
    memberId: string,
    userId: string,
    newRole: MemberRole,
  ): Promise<WorkspaceMember>;

  // Remove member from workspace
  remove(workspaceId: string, memberId: string, userId: string): Promise<void>;

  // Check if user has permission for action
  checkPermission(
    workspaceId: string,
    userId: string,
    action: WorkspaceAction,
  ): Promise<boolean>;
}
```

### Permission Model

```typescript
type MemberRole = "owner" | "admin" | "member";

type WorkspaceAction =
  | "invite_members"
  | "manage_members"
  | "update_workspace"
  | "delete_workspace"
  | "create_project"
  | "view_workspace";

const PERMISSIONS: Record<MemberRole, WorkspaceAction[]> = {
  owner: [
    "invite_members",
    "manage_members",
    "update_workspace",
    "delete_workspace",
    "create_project",
    "view_workspace",
  ],
  admin: [
    "invite_members",
    "manage_members",
    "create_project",
    "view_workspace",
  ],
  member: ["create_project", "view_workspace"],
};
```

## Data Models

### Invitation

```typescript
interface Invitation {
  id: string;
  workspaceId: string;
  inviterUserId: string;
  inviteeEmail: string;
  role: MemberRole;
  status: "pending" | "accepted" | "declined" | "cancelled";
  expiresAt: Date;
  acceptedAt: Date | null;
  declinedAt: Date | null;
  createdAt: Date;
}
```

### InvitationDetails (for accept page)

```typescript
interface InvitationDetails {
  invitation: Invitation;
  workspace: {
    id: string;
    name: string;
    icon: string;
  };
  inviter: {
    name: string | null;
    email: string;
  };
}
```

### WorkspaceMemberWithUser

```typescript
interface WorkspaceMemberWithUser {
  id: string;
  workspaceId: string;
  userId: string;
  role: MemberRole;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    name: string | null;
    profilePicture: string | null;
  };
}
```

### Email Template Data

```typescript
interface InvitationEmailData {
  inviteeName: string | null; // From existing user or null
  inviterName: string | null;
  workspaceName: string;
  workspaceIcon: string;
  invitationUrl: string;
  expiresAt: Date;
  role: MemberRole;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Invitation Creation Properties

**Property 1: Valid invitation creation**
_For any_ workspace owner, valid email address, and role, creating an invitation should result in a pending invitation record with all required fields (inviter ID, invitee email, workspace ID, role, token hash, expiration date 7 days in future).
**Validates: Requirements 1.1, 1.5, 1.6**

**Property 2: Email sent on invitation creation**
_For any_ created invitation, the email service should be called with the invitation token, workspace details, and inviter information.
**Validates: Requirements 1.2**

**Property 3: Duplicate member invitation rejected**
_For any_ workspace and email address where the user is already a member, attempting to create an invitation should return an error.
**Validates: Requirements 1.3**

**Property 4: Duplicate pending invitation rejected**
_For any_ workspace and email address with a pending invitation, attempting to create another invitation should return an error.
**Validates: Requirements 1.4**

### Invitation Acceptance Properties

**Property 5: Valid token returns invitation details**
_For any_ valid, non-expired, pending invitation token, the verify endpoint should return the invitation details including workspace name, icon, inviter name, and role.
**Validates: Requirements 2.1**

**Property 6: Accepting invitation creates membership**
_For any_ valid pending invitation and authenticated user with matching email, accepting the invitation should create a workspace_members record with the specified role AND mark the invitation as accepted with an acceptance timestamp.
**Validates: Requirements 2.2, 2.3**

**Property 7: Expired token rejected**
_For any_ invitation token where the expiration date is in the past, attempting to verify or accept should return an error.
**Validates: Requirements 2.6**

**Property 8: Invalid token rejected**
_For any_ token that doesn't match any invitation hash in the database, attempting to verify or accept should return an error.
**Validates: Requirements 2.7**

### Invitation Decline Properties

**Property 9: Declining invitation updates status**
_For any_ valid pending invitation token, declining should mark the invitation as declined AND record the decline timestamp.
**Validates: Requirements 3.1, 3.2**

### Invitation Management Properties

**Property 10: Pending invitations list completeness**
_For any_ workspace, the pending invitations list should include all invitations with status "pending" and include invitee email, creation date, and expiration date for each.
**Validates: Requirements 4.1, 4.2**

**Property 11: Cancelling invitation prevents use**
_For any_ pending invitation, cancelling should mark it as cancelled AND subsequent attempts to accept that invitation should fail with an error.
**Validates: Requirements 4.3, 4.4**

**Property 12: Resending generates new token**
_For any_ pending invitation, resending should generate a new token hash, update the expiration date to 7 days from now, and trigger the email service.
**Validates: Requirements 4.5**

### Member Management Properties

**Property 13: Members list completeness**
_For any_ workspace, the members list should include all workspace_members records with user name, email, role, and join date.
**Validates: Requirements 5.1, 5.2**

**Property 14: Role update persistence**
_For any_ workspace member (except owner) and valid role, updating the role should change the role value in the workspace_members table.
**Validates: Requirements 5.3**

**Property 15: Member removal deletes record**
_For any_ workspace member who is not the owner and not the requesting user, removing should delete the workspace_members record.
**Validates: Requirements 5.4**

**Property 16: Self-removal prevention**
_For any_ user attempting to remove their own workspace membership, the operation should fail with an error.
**Validates: Requirements 5.5**

**Property 17: Self-role-change prevention**
_For any_ user attempting to change their own role in a workspace, the operation should fail with an error.
**Validates: Requirements 5.6**

### Workspace List Properties

**Property 18: User workspace list completeness**
_For any_ user, their workspace list should include all workspaces where they have a workspace_members record, with workspace name, icon, role, and member count.
**Validates: Requirements 6.1, 6.2, 6.4**

### Email Content Properties

**Property 19: Invitation email completeness**
_For any_ invitation email sent, it should include workspace name in the subject, inviter name in the body, workspace details in the body, invitation link with token, expiration date, and both HTML and plain text versions.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

### Permission Properties

**Property 20: Owner permissions**
_For any_ user with owner role in a workspace, permission checks for all actions (invite_members, manage_members, update_workspace, delete_workspace, create_project, view_workspace) should return true.
**Validates: Requirements 8.2**

**Property 21: Admin permissions**
_For any_ user with admin role in a workspace, permission checks for invite_members, manage_members, create_project, and view_workspace should return true, and delete_workspace should return false.
**Validates: Requirements 8.3**

**Property 22: Member permissions**
_For any_ user with member role in a workspace, permission checks for create_project and view_workspace should return true, and invite_members, manage_members, update_workspace, delete_workspace should return false.
**Validates: Requirements 8.4**

### Security Properties

**Property 23: Token hash storage**
_For any_ invitation created, the tokenHash stored in the database should not equal the original token (tokens must be hashed before storage).
**Validates: Requirements 9.2**

**Property 24: Maximum pending invitations**
_For any_ workspace with 5 pending invitations, attempting to create a 6th pending invitation should fail with an error.
**Validates: Requirements 9.4**

**Property 25: Expired invitation cleanup**
_For any_ invitation with status "pending" or "cancelled" and expiration date more than 30 days in the past, the cleanup function should remove it from the database.
**Validates: Requirements 9.5**

## Error Handling

### Validation Errors (400 Bad Request)

- Invalid email format
- Invalid role value (not owner/admin/member)
- Missing required fields
- Workspace at maximum pending invitations (5)

### Authentication Errors (401 Unauthorized)

- Missing authentication token
- Invalid or expired session
- Email mismatch (accepting invitation for different email)

### Authorization Errors (403 Forbidden)

- User not a member of workspace
- User lacks permission for action (e.g., member trying to invite)
- Attempting to modify own role
- Attempting to remove self from workspace
- Attempting to remove or modify workspace owner

### Not Found Errors (404 Not Found)

- Workspace not found
- Invitation not found
- Member not found

### Conflict Errors (409 Conflict)

- Email already a workspace member
- Pending invitation already exists for email
- Invitation already accepted/declined/cancelled

### Token Errors (410 Gone)

- Invitation token expired
- Invitation cancelled

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

### Error Handling Strategy

1. **Validation**: Use Zod schemas for request validation
2. **Database Errors**: Catch unique constraint violations and foreign key errors
3. **Token Verification**: Verify token hash and expiration before processing
4. **Permission Checks**: Verify user role before allowing actions
5. **Graceful Degradation**: Log errors but don't expose internal details to clients

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

### Unit Testing Focus

Unit tests should cover:

- Specific invitation flow examples (send → accept → member added)
- Edge cases (expired tokens, cancelled invitations, duplicate emails)
- Error conditions (invalid tokens, permission denied, missing fields)
- Integration points (email service calls, database transactions)

Avoid writing too many unit tests - property-based tests handle covering lots of inputs.

### Property-Based Testing

**Library**: Use `fast-check` for TypeScript property-based testing

**Configuration**:

- Minimum 100 iterations per property test
- Each property test must reference its design document property
- Tag format: `Feature: workspace-team-invitations, Property {number}: {property_text}`

**Key Properties to Test**:

1. Invitation creation with random valid inputs always creates valid records
2. Token validation correctly identifies valid/invalid/expired tokens
3. Permission checks correctly enforce role-based access
4. State transitions (pending → accepted/declined/cancelled) maintain consistency
5. Email service integration receives correct parameters

**Example Property Test Structure**:

```typescript
import fc from "fast-check";

// Feature: workspace-team-invitations, Property 1: Valid invitation creation
test("creating invitation with valid inputs creates pending record", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.uuid(), // workspaceId
      fc.uuid(), // inviterUserId
      fc.emailAddress(), // inviteeEmail
      fc.constantFrom("admin", "member"), // role
      async (workspaceId, inviterUserId, inviteeEmail, role) => {
        const invitation = await invitationService.create(
          workspaceId,
          inviterUserId,
          inviteeEmail,
          role,
        );

        expect(invitation.status).toBe("pending");
        expect(invitation.workspaceId).toBe(workspaceId);
        expect(invitation.inviterUserId).toBe(inviterUserId);
        expect(invitation.inviteeEmail).toBe(inviteeEmail);
        expect(invitation.role).toBe(role);
        expect(invitation.expiresAt).toBeGreaterThan(new Date());
      },
    ),
    { numRuns: 100 },
  );
});
```

### Integration Testing

- Test complete invitation flow: create → email → accept → member added
- Test permission enforcement across all endpoints
- Test database constraints (unique constraints, foreign keys)
- Test email service integration (mock in tests, verify calls)

### Manual Testing Checklist

- [ ] Send invitation and verify email received
- [ ] Accept invitation and verify workspace access
- [ ] Decline invitation and verify cannot accept later
- [ ] Cancel invitation and verify token no longer works
- [ ] Resend invitation and verify new email with new token
- [ ] Test role permissions (owner, admin, member)
- [ ] Test error cases (expired token, duplicate invite, etc.)
- [ ] Test UI flows (invitation page, team management page)
