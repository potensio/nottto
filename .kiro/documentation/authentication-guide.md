# Authentication Architecture Documentation

> **Purpose**: This document serves as a replicable guide for implementing JWT-based authentication in Next.js projects. Copy and adapt for your own projects.

## 📚 Overview

This architecture implements a **JWT-based authentication system** with HTTP-only cookies, providing a secure, stateless authentication mechanism that works seamlessly with Next.js App Router and Edge Runtime.

### Key Technologies

- **Next.js 14+** (App Router)
- **jose** - Edge-compatible JWT library
- **bcryptjs** - Password hashing
- **React Query** - Client-side state management
- **Prisma** - Database ORM (adaptable to other ORMs)

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   useAuth()     │    │   useLogin()    │    │   useLogout()   │         │
│  │   useCurrentUser│    │   useRegister() │    │                 │         │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘         │
│           │                      │                      │                   │
│           └──────────────────────┼──────────────────────┘                   │
│                                  ↓                                          │
│                    ┌─────────────────────────┐                              │
│                    │   React Query Cache     │                              │
│                    │   (currentUser query)   │                              │
│                    └─────────────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓ HTTP Request (with cookies)
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MIDDLEWARE LAYER                                   │
│                         (src/middleware.ts)                                  │
│                                                                              │
│  • Route protection (Edge Runtime compatible)                               │
│  • JWT verification using jose library                                      │
│  • Role-based redirects (USER vs ADMIN/STAFF)                              │
│  • Public route handling (/auth)                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Auth Endpoints                                    │   │
│  │  POST /api/auth/login     → Validate credentials, set cookie        │   │
│  │  POST /api/auth/register  → Create user, set cookie                 │   │
│  │  POST /api/auth/logout    → Clear cookie                            │   │
│  │  GET  /api/auth/me        → Verify token, return user data          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Protected Endpoints                               │   │
│  │  verifyAuth(request) → Extract & validate JWT from cookie           │   │
│  │  Authorization check → Verify user role (ADMIN/STAFF/USER)          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SERVICE LAYER                                     │
│                     (src/lib/services/auth.service.ts)                       │
│                                                                              │
│  • User registration with password hashing (bcrypt)                         │
│  • Login with credential verification                                       │
│  • JWT generation using jose (SignJWT)                                      │
│  • Token verification (jwtVerify)                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATA LAYER                                       │
│                              (Prisma)                                        │
│                                                                              │
│  User model with: id, email, password, userType, assignedVenueIds          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Features

### 1. HTTP-Only Cookies

```typescript
response.cookies.set("auth-token", token, {
  httpOnly: true, // ← Not accessible via JavaScript
  secure: process.env.NODE_ENV === "production", // ← HTTPS only in production
  sameSite: "lax", // ← CSRF protection
  maxAge: 60 * 60 * 24 * 7, // ← 7 days expiration
  path: "/",
});
```

**Why this is good:**

- ✅ **XSS Protection**: `httpOnly` prevents JavaScript access to the token
- ✅ **CSRF Protection**: `sameSite: "lax"` prevents cross-site request forgery
- ✅ **Secure Transport**: `secure: true` ensures HTTPS-only in production
- ✅ **Automatic Handling**: Browser automatically sends cookies with requests

### 2. JWT Token Structure

```typescript
const token = await new SignJWT({
  userId: user.id,
  email: user.email,
  userType: user.userType, // USER | ADMIN | STAFF
  assignedVenueIds: user.assignedVenueIds, // For STAFF authorization
})
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("7d")
  .sign(secretKey);
```

**Why this is good:**

- ✅ **Stateless**: No server-side session storage needed
- ✅ **Self-contained**: Contains all necessary user context
- ✅ **Expiration**: Built-in token expiration (7 days)
- ✅ **Role Information**: Includes `userType` for authorization decisions

### 3. Edge-Compatible JWT Library (jose)

```typescript
import { jwtVerify, SignJWT } from "jose";

// Works in Edge Runtime (middleware)
const secret = new TextEncoder().encode(JWT_SECRET);
const { payload } = await jwtVerify(token, secret);
```

**Why this is good:**

- ✅ **Edge Runtime Compatible**: Works in Next.js middleware
- ✅ **Modern API**: Uses Web Crypto API
- ✅ **No Node.js Dependencies**: Runs anywhere JavaScript runs

---

## 🛡️ Multi-Layer Protection

### Layer 1: Middleware (Route Protection)

```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;

  // 1. Redirect unauthenticated users to /auth
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // 2. Verify token and check role
  const { payload } = await jwtVerify(token, secret);
  const userType = payload.userType;

  // 3. Role-based access control
  if (userType === "USER" && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/dashboard/booking", request.url));
  }

  if (userType !== "USER" && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }
}
```

**Protection scope:**

- `/admin/*` → ADMIN, STAFF only
- `/dashboard/*` → USER only
- `/auth/*` → Public (redirects authenticated users)

### Layer 2: API Route (Authentication + Authorization)

```typescript
// src/app/api/admin/orders/route.ts
export async function GET(request: NextRequest) {
  // 1. Authentication: Verify JWT token
  const tokenResult = await verifyAuth(request);
  if (!tokenResult.isValid) {
    return NextResponse.json({ message: tokenResult.error }, { status: 401 });
  }

  // 2. Authorization: Check user role
  const { user } = tokenResult;
  if (!ALLOWED_ADMIN_ROLES.includes(user.userType)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // 3. Pass user context to service layer
  const result = await getOrdersForAdmin({
    userType: user.userType,
    assignedVenueIds: user.assignedVenueIds,
    ...params,
  });
}
```

### Layer 3: Service Layer (Data-Level Authorization)

```typescript
// src/lib/services/order.service.ts
function buildVenueFilter(userType: UserType, assignedVenueIds: string[]) {
  // ADMIN: Can see all venues
  if (userType === "ADMIN") {
    return undefined; // No filter
  }

  // STAFF: Only assigned venues
  if (userType === "STAFF") {
    return {
      some: {
        court: {
          venueId: { in: assignedVenueIds },
        },
      },
    };
  }

  // Default: No access
  return { some: { court: { venueId: { in: [] } } } };
}
```

---

## 🔄 Authentication Flow

### Login Flow

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────┐
│ Browser │     │ /api/auth/  │     │ authService │     │ Database │
│         │     │   login     │     │             │     │          │
└────┬────┘     └──────┬──────┘     └──────┬──────┘     └────┬─────┘
     │                 │                   │                  │
     │ POST {email,    │                   │                  │
     │      password}  │                   │                  │
     │────────────────>│                   │                  │
     │                 │                   │                  │
     │                 │ login(data)       │                  │
     │                 │──────────────────>│                  │
     │                 │                   │                  │
     │                 │                   │ findUnique(email)│
     │                 │                   │─────────────────>│
     │                 │                   │                  │
     │                 │                   │<─────────────────│
     │                 │                   │     user         │
     │                 │                   │                  │
     │                 │                   │ bcrypt.compare() │
     │                 │                   │                  │
     │                 │                   │ SignJWT()        │
     │                 │                   │                  │
     │                 │<──────────────────│                  │
     │                 │  {user, token}    │                  │
     │                 │                   │                  │
     │ Set-Cookie:     │                   │                  │
     │ auth-token=xxx  │                   │                  │
     │<────────────────│                   │                  │
     │                 │                   │                  │
     │ {success, user} │                   │                  │
     │<────────────────│                   │                  │
```

### Protected Request Flow

```
┌─────────┐     ┌────────────┐     ┌─────────────┐     ┌─────────────┐
│ Browser │     │ Middleware │     │ API Route   │     │ Service     │
└────┬────┘     └─────┬──────┘     └──────┬──────┘     └──────┬──────┘
     │                │                   │                   │
     │ GET /admin/... │                   │                   │
     │ Cookie: auth-  │                   │                   │
     │ token=xxx      │                   │                   │
     │───────────────>│                   │                   │
     │                │                   │                   │
     │                │ jwtVerify(token)  │                   │
     │                │                   │                   │
     │                │ Check userType    │                   │
     │                │ (ADMIN/STAFF?)    │                   │
     │                │                   │                   │
     │                │──────────────────>│                   │
     │                │     (allowed)     │                   │
     │                │                   │                   │
     │                │                   │ verifyAuth()      │
     │                │                   │                   │
     │                │                   │ Check role        │
     │                │                   │                   │
     │                │                   │ getData({         │
     │                │                   │   userType,       │
     │                │                   │   assignedVenueIds│
     │                │                   │ })                │
     │                │                   │──────────────────>│
     │                │                   │                   │
     │                │                   │<──────────────────│
     │                │                   │     data          │
     │                │                   │                   │
     │<───────────────────────────────────│                   │
     │              {success, data}       │                   │
```

---

## 📁 File Structure

```
src/
├── middleware.ts                    # Route protection (Edge Runtime)
│
├── lib/
│   ├── auth-utils.ts               # verifyAuth() utility for API routes
│   └── services/
│       └── auth.service.ts         # Login, register, token verification
│
├── hooks/
│   └── use-auth.ts                 # Client-side auth hooks
│       ├── useAuth()               # Get current user state
│       ├── useLogin()              # Login mutation
│       ├── useRegister()           # Register mutation
│       ├── useLogout()             # Logout mutation
│       └── useCurrentUser()        # React Query for user data
│
└── app/api/auth/
    ├── login/route.ts              # POST /api/auth/login
    ├── register/route.ts           # POST /api/auth/register
    ├── logout/route.ts             # POST /api/auth/logout
    └── me/route.ts                 # GET /api/auth/me
```

---

## 🎯 Why This Approach is Good

### 1. Security First

| Feature                   | Benefit                      |
| ------------------------- | ---------------------------- |
| HTTP-only cookies         | Prevents XSS token theft     |
| SameSite cookies          | Prevents CSRF attacks        |
| Secure flag               | Ensures HTTPS in production  |
| Password hashing (bcrypt) | Protects stored passwords    |
| JWT expiration            | Limits token validity window |

### 2. Stateless & Scalable

- **No session storage**: JWT contains all necessary data
- **Horizontal scaling**: Any server can verify tokens
- **Edge compatible**: Works in Vercel Edge, Cloudflare Workers

### 3. Clean Separation of Concerns

```
Middleware     → Route-level protection (fast, Edge)
API Layer      → Request-level auth + authorization
Service Layer  → Data-level authorization (venue filtering)
```

### 4. Developer Experience

```typescript
// Simple hook usage in components
const { user, isAuthenticated, isLoading } = useAuth();

// Protected API calls just work (cookies sent automatically)
const { data } = useQuery({
  queryKey: ["orders"],
  queryFn: () => fetch("/api/admin/orders").then((r) => r.json()),
});
```

### 5. Type Safety

```typescript
// AuthUser interface ensures consistent user context
interface AuthUser {
  userId: string;
  email: string;
  userType: UserType; // "USER" | "ADMIN" | "STAFF"
  assignedVenueIds: string[];
}

// verifyAuth returns discriminated union
type AuthResult =
  | { isValid: true; user: AuthUser }
  | { isValid: false; error: string };
```

---

## 🔧 Usage Examples

### Protecting an API Route

```typescript
import { verifyAuth } from "@/lib/auth-utils";
import { UserType } from "@/types/prisma";

const ALLOWED_ROLES: UserType[] = [UserType.ADMIN, UserType.STAFF];

export async function GET(request: NextRequest) {
  // 1. Authentication
  const tokenResult = await verifyAuth(request);
  if (!tokenResult.isValid) {
    return NextResponse.json(
      { success: false, message: tokenResult.error },
      { status: 401 }
    );
  }

  // 2. Authorization
  const { user } = tokenResult;
  if (!ALLOWED_ROLES.includes(user.userType)) {
    return NextResponse.json(
      { success: false, message: "Forbidden - Admin access required" },
      { status: 403 }
    );
  }

  // 3. Use user context in service call
  const result = await myService.getData({
    userType: user.userType,
    assignedVenueIds: user.assignedVenueIds,
  });

  return NextResponse.json({ success: true, data: result });
}
```

### Using Auth in Components

```typescript
"use client";

import { useAuth } from "@/hooks/use-auth";

export function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Skeleton />;
  if (!isAuthenticated) return <LoginPrompt />;

  return (
    <div>
      <p>Welcome, {user.email}!</p>
      {user.userType === "ADMIN" && <AdminPanel />}
    </div>
  );
}
```

### Handling Login

```typescript
"use client";

import { useLogin } from "@/hooks/use-auth";

export function LoginForm() {
  const { mutate: login, isPending } = useLogin();

  const handleSubmit = (data: LoginFormInput) => {
    login(data); // Automatically redirects on success
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={isPending}>
        {isPending ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
```

---

## 🚀 Best Practices Implemented

1. **Defense in Depth**: Multiple layers of protection (middleware + API + service)
2. **Principle of Least Privilege**: STAFF only sees assigned venues
3. **Fail Secure**: Invalid tokens result in 401, not silent failures
4. **Secure Defaults**: HTTP-only, secure, sameSite cookies by default
5. **Separation of Concerns**: Auth logic isolated in dedicated files
6. **Type Safety**: Full TypeScript coverage for auth types
7. **Caching**: React Query caches user data (5 min stale time)
8. **Edge Compatibility**: jose library works in Edge Runtime

---

## 🔮 Potential Improvements

### High Priority

#### 1. Refresh Token Rotation

**Current**: Single JWT with 7-day expiration  
**Improvement**: Implement refresh token rotation for better security

```typescript
// Suggested implementation
interface TokenPair {
  accessToken: string; // Short-lived (15 min)
  refreshToken: string; // Long-lived (7 days), stored in DB
}

// Benefits:
// - Shorter access token exposure window
// - Ability to revoke refresh tokens
// - Detect token reuse attacks
```

#### 2. Token Revocation / Blacklist

**Current**: No way to invalidate tokens before expiration  
**Improvement**: Implement token blacklist or version-based invalidation

```typescript
// Option A: Redis blacklist
const isBlacklisted = await redis.get(`blacklist:${tokenId}`);

// Option B: Token version in user table
// Increment user.tokenVersion on logout/password change
// Reject tokens with old version
interface JWTPayload {
  userId: string;
  tokenVersion: number; // Must match user.tokenVersion
}
```

#### 3. Rate Limiting

**Current**: No rate limiting on auth endpoints  
**Improvement**: Add rate limiting to prevent brute force attacks

```typescript
// Using upstash/ratelimit or similar
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
});

// In login route
const { success } = await ratelimit.limit(ip);
if (!success) {
  return NextResponse.json({ message: "Too many attempts" }, { status: 429 });
}
```

### Medium Priority

#### 4. Password Policy Enforcement

**Current**: Basic validation only  
**Improvement**: Enforce strong password requirements

```typescript
const passwordSchema = z
  .string()
  .min(8, "Minimum 8 characters")
  .regex(/[A-Z]/, "At least one uppercase letter")
  .regex(/[a-z]/, "At least one lowercase letter")
  .regex(/[0-9]/, "At least one number")
  .regex(/[^A-Za-z0-9]/, "At least one special character");
```

#### 5. Account Lockout

**Current**: No lockout after failed attempts  
**Improvement**: Lock account after N failed login attempts

```typescript
// Track failed attempts in database or Redis
interface LoginAttempt {
  userId: string;
  failedAttempts: number;
  lockedUntil: Date | null;
}

// Lock for 15 minutes after 5 failed attempts
if (failedAttempts >= 5) {
  await lockAccount(userId, 15 * 60 * 1000);
}
```

#### 6. Audit Logging

**Current**: Basic console logging  
**Improvement**: Comprehensive security audit trail

```typescript
interface AuditLog {
  event:
    | "LOGIN"
    | "LOGOUT"
    | "LOGIN_FAILED"
    | "PASSWORD_CHANGE"
    | "TOKEN_REFRESH";
  userId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Log all auth events to database
await prisma.auditLog.create({ data: auditLog });
```

#### 7. Multi-Factor Authentication (MFA)

**Current**: Password-only authentication  
**Improvement**: Add TOTP or SMS-based 2FA

```typescript
// Using otplib for TOTP
import { authenticator } from "otplib";

// Generate secret for user
const secret = authenticator.generateSecret();

// Verify TOTP code
const isValid = authenticator.verify({ token: userCode, secret });
```

### Lower Priority (Nice to Have)

#### 8. OAuth / Social Login

Add Google, GitHub, or other OAuth providers for easier onboarding.

```typescript
// Using next-auth or custom OAuth implementation
// Supports: Google, GitHub, Discord, etc.
```

#### 9. Session Management UI

Allow users to view and revoke active sessions.

```typescript
interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: Date;
  isCurrent: boolean;
}

// GET /api/auth/sessions - List all sessions
// DELETE /api/auth/sessions/:id - Revoke specific session
```

#### 10. Password Reset Flow

**Current**: Not implemented  
**Improvement**: Secure password reset via email

```typescript
// 1. Generate secure reset token
const resetToken = crypto.randomBytes(32).toString("hex");
const hashedToken = await bcrypt.hash(resetToken, 10);

// 2. Store with expiration (1 hour)
await prisma.passwordReset.create({
  data: {
    userId,
    token: hashedToken,
    expiresAt: new Date(Date.now() + 3600000),
  },
});

// 3. Send email with reset link
await sendEmail(user.email, `Reset: /auth/reset?token=${resetToken}`);
```

#### 11. CSRF Token for Mutations

**Current**: Relies on SameSite cookies only  
**Improvement**: Add CSRF token for extra protection on state-changing requests

```typescript
// Generate CSRF token on page load
const csrfToken = crypto.randomUUID();

// Include in request headers
headers: { "X-CSRF-Token": csrfToken }

// Validate on server
if (request.headers.get("X-CSRF-Token") !== session.csrfToken) {
  return NextResponse.json({ message: "Invalid CSRF token" }, { status: 403 });
}
```

---

## 📋 Replication Checklist

When implementing this pattern in a new project:

### Setup

- [ ] Install dependencies: `jose`, `bcryptjs`, `@tanstack/react-query`
- [ ] Set `JWT_SECRET` environment variable (use strong random string)
- [ ] Create User model with: `id`, `email`, `password`, `userType`

### Core Files to Create

- [ ] `src/middleware.ts` - Route protection
- [ ] `src/lib/auth-utils.ts` - `verifyAuth()` utility
- [ ] `src/lib/services/auth.service.ts` - Auth business logic
- [ ] `src/hooks/use-auth.ts` - Client-side hooks
- [ ] `src/app/api/auth/login/route.ts`
- [ ] `src/app/api/auth/register/route.ts`
- [ ] `src/app/api/auth/logout/route.ts`
- [ ] `src/app/api/auth/me/route.ts`

### Configuration

- [ ] Define protected routes in middleware
- [ ] Define user roles/types
- [ ] Configure cookie settings (secure, sameSite, maxAge)
- [ ] Set up React Query provider

### Testing

- [ ] Test login flow
- [ ] Test protected route access
- [ ] Test role-based authorization
- [ ] Test token expiration handling
- [ ] Test logout clears session

---

## 📚 References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://auth0.com/blog/jwt-security-best-practices/)
- [jose Library Documentation](https://github.com/panva/jose)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

**Last Updated**: January 2026  
**Pattern Version**: 1.0  
**Status**: Production Ready (with room for improvements noted above)
