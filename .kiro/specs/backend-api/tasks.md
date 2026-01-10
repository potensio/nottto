# Implementation Plan: Nottto Backend API

## Overview

This plan implements the Nottto Backend API using Hono, Drizzle ORM, and Neon PostgreSQL. Tasks are organized to build incrementally, starting with project setup, then core infrastructure, followed by feature implementation.

## Tasks

- [x] 1. Set up monorepo structure and API project

  - [x] 1.1 Initialize pnpm workspace with apps/api and packages/shared directories
    - Create pnpm-workspace.yaml
    - Create root package.json with workspace scripts
    - _Requirements: Project structure from backend-project-plan.md_
  - [x] 1.2 Set up apps/api with Hono and Bun
    - Initialize package.json with Hono, zod, jose, bcryptjs dependencies
    - Create tsconfig.json for the API
    - Create src/index.ts entry point with basic Hono app
    - _Requirements: Tech stack specification_
  - [x] 1.3 Set up packages/shared for shared types and schemas
    - Initialize package.json
    - Create tsconfig.json
    - Set up exports for types, schemas, and db modules
    - _Requirements: Monorepo structure_

- [x] 2. Implement database schema and connection

  - [x] 2.1 Set up Drizzle with Neon PostgreSQL
    - Install drizzle-orm, @neondatabase/serverless, drizzle-kit
    - Create db/index.ts with Neon connection
    - Create drizzle.config.ts for migrations
    - _Requirements: 8.1_
  - [x] 2.2 Define database schema in packages/shared
    - Create users, workspaces, workspace_members, projects, annotations tables
    - Define relations between tables
    - Export schema types
    - _Requirements: 8.1, Data Models from design_
  - [x] 2.3 Create and run initial migration
    - Generate migration with drizzle-kit
    - Apply migration to Neon database
    - _Requirements: 8.1_

- [x] 3. Implement shared validation schemas and types

  - [x] 3.1 Create Zod validation schemas
    - Auth schemas (register, login)
    - Workspace schemas (create, update)
    - Project schemas (create, update)
    - Annotation schemas (create, update)
    - _Requirements: 7.5_
  - [x] 3.2 Create TypeScript types
    - User, Workspace, Project, Annotation interfaces
    - API response types
    - _Requirements: Type safety_

- [x] 4. Implement authentication system

  - [x] 4.1 Create auth utility functions
    - Password hashing with bcryptjs
    - JWT token generation/verification with jose
    - _Requirements: 1.1, 7.3_
  - [ ]\* 4.2 Write property test for password hashing
    - **Property 1: Password hashing invariant**
    - **Validates: Requirements 1.1, 7.3**
  - [x] 4.3 Create auth middleware
    - Extract and verify JWT from Authorization header
    - Set userId and userEmail in context
    - Return 401 for invalid/missing tokens
    - _Requirements: 7.1, 7.2_
  - [x] 4.4 Implement auth service
    - register(): create user + default workspace + default project
    - login(): verify credentials, return tokens
    - refresh(): verify refresh token, return new access token
    - getUser(): return user profile
    - _Requirements: 1.1-1.7, 2.1-2.5_
  - [ ]\* 4.5 Write property test for registration setup
    - **Property 2: Registration creates complete user setup**
    - **Validates: Requirements 1.2, 1.3, 8.3**
  - [ ]\* 4.6 Write property test for authentication round-trip
    - **Property 3: Authentication token round-trip**
    - **Validates: Requirements 2.1, 2.5**
  - [x] 4.7 Create auth routes
    - POST /auth/register
    - POST /auth/login
    - POST /auth/refresh
    - GET /auth/me (protected)
    - _Requirements: 1.1-1.7, 2.1-2.5_

- [x] 5. Checkpoint - Verify auth system

  - Ensure all auth tests pass
  - Test registration and login manually
  - Ask the user if questions arise

- [x] 6. Implement workspace management

  - [x] 6.1 Create workspace service
    - list(): return user's workspaces (owner or member)
    - create(): create workspace with generated slug
    - get(): return workspace if user has access
    - update(): update workspace if owner
    - delete(): cascade delete workspace, projects, annotations
    - _Requirements: 3.1-3.7_
  - [x] 6.2 Create slug generation utility
    - Generate URL-safe slug from name
    - Handle duplicates by appending numbers
    - _Requirements: 3.2_
  - [ ]\* 6.3 Write property test for slug uniqueness
    - **Property 6: Slug generation uniqueness**
    - **Validates: Requirements 3.2, 4.2**
  - [ ]\* 6.4 Write property test for workspace authorization
    - **Property 5: Workspace ownership authorization**
    - **Validates: Requirements 3.1, 3.3, 3.4, 3.5, 3.6**
  - [ ]\* 6.5 Write property test for cascade deletion
    - **Property 7: Workspace cascade deletion**
    - **Validates: Requirements 3.5, 8.4**
  - [x] 6.6 Create workspace routes
    - GET /workspaces (protected)
    - POST /workspaces (protected)
    - GET /workspaces/:id (protected)
    - PATCH /workspaces/:id (protected)
    - DELETE /workspaces/:id (protected)
    - _Requirements: 3.1-3.7_

- [-] 7. Implement project management

  - [x] 7.1 Create project service
    - list(): return projects in workspace if user has access
    - create(): create project with generated slug
    - get(): return project if user has workspace access
    - update(): update project if user has workspace access
    - delete(): cascade delete project and annotations
    - _Requirements: 4.1-4.7_
  - [ ]\* 7.2 Write property test for project authorization
    - **Property 8: Project ownership through workspace**
    - **Validates: Requirements 4.1, 4.3, 4.4, 4.5, 4.6**
  - [ ]\* 7.3 Write property test for project cascade deletion
    - **Property 9: Project cascade deletion**
    - **Validates: Requirements 4.5, 8.5**
  - [x] 7.4 Create project routes
    - GET /workspaces/:workspaceId/projects (protected)
    - POST /workspaces/:workspaceId/projects (protected)
    - GET /projects/:id (protected)
    - PATCH /projects/:id (protected)
    - DELETE /projects/:id (protected)
    - _Requirements: 4.1-4.7_

- [x] 8. Checkpoint - Verify workspace and project management

  - Ensure all workspace and project tests pass
  - Test CRUD operations manually
  - Ask the user if questions arise

- [x] 9. Implement annotation management

  - [x] 9.1 Create annotation service
    - list(): return annotations in project if user has access
    - create(): create annotation associated with user
    - get(): return annotation if user has project access
    - update(): update annotation if user created it
    - delete(): delete annotation if user created it
    - _Requirements: 5.1-5.7_
  - [ ]\* 9.2 Write property test for annotation user association
    - **Property 10: Annotation user association**
    - **Validates: Requirements 5.2**
  - [ ]\* 9.3 Write property test for annotation metadata
    - **Property 11: Annotation metadata preservation**
    - **Validates: Requirements 5.3, 5.7, 6.4**
  - [x] 9.4 Create annotation routes
    - GET /projects/:projectId/annotations (protected)
    - POST /projects/:projectId/annotations (protected)
    - GET /annotations/:id (protected)
    - PATCH /annotations/:id (protected)
    - DELETE /annotations/:id (protected)
    - _Requirements: 5.1-5.7_

- [-] 10. Implement file upload

  - [x] 10.1 Create upload service with Vercel Blob
    - Install @vercel/blob
    - Implement uploadScreenshot(): validate file, upload to blob, return URL
    - Validate file size (max 10MB) and type (image/\*)
    - _Requirements: 6.1-6.4_
  - [x] 10.2 Create upload routes
    - POST /upload/screenshot (protected, multipart/form-data)
    - _Requirements: 6.1-6.4_

- [-] 11. Implement error handling and security

  - [x] 11.1 Create error handler middleware
    - Handle HTTPException, ZodError, and generic errors
    - Format consistent error responses
    - Hide internal details from responses
    - _Requirements: 8.2_
  - [ ]\* 11.2 Write property test for protected endpoints
    - **Property 12: Protected endpoints require authentication**
    - **Validates: Requirements 7.1**
  - [ ]\* 11.3 Write property test for input validation
    - **Property 13: Input validation rejects invalid data**
    - **Validates: Requirements 1.6, 1.7, 7.5**
  - [ ]\* 11.4 Write property test for error response safety
    - **Property 14: Error responses hide internal details**
    - **Validates: Requirements 8.2**

- [x] 12. Final checkpoint - Complete API verification

  - Ensure all tests pass
  - Verify all endpoints work correctly
  - Review error handling
  - Ask the user if questions arise

- [x] 13. Prepare for deployment
  - [x] 13.1 Create Vercel configuration
    - Create vercel.json for API deployment
    - Configure environment variables
    - _Requirements: Deployment_
  - [x] 13.2 Create environment configuration
    - Create .env.example with all required variables
    - Document environment setup in README
    - _Requirements: Environment setup_

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation before proceeding
- Property tests use fast-check with minimum 100 iterations
- The implementation uses TypeScript throughout for type safety
