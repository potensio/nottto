# Implementation Plan: Extension Annotation Creation

## Overview

This plan implements the annotation creation flow from the Chrome extension to the backend API with Vercel Blob storage. Tasks are ordered to build incrementally: schema updates first, then API changes, then extension integration.

## Tasks

- [x] 1. Update shared schemas for base64 screenshot support

  - [x] 1.1 Add screenshotAnnotatedBase64 field to createAnnotationSchema in packages/shared/src/schemas/index.ts
    - Add optional string field for base64 data URL
    - Keep existing screenshotAnnotated URL field for backwards compatibility
    - _Requirements: 6.1, 6.3_

- [x] 2. Implement base64 upload service

  - [x] 2.1 Create uploadBase64Screenshot function in apps/api/src/services/upload.ts
    - Parse and validate base64 data URL format (data:image/type;base64,...)
    - Validate allowed image types (PNG, JPEG, GIF, WebP)
    - Validate file size (max 10MB)
    - Convert base64 to buffer and upload to Vercel Blob
    - Return public URL
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3_
  - [ ]\* 2.2 Write property test for base64 upload validation
    - **Property 1: Base64 Screenshot Upload Produces Valid URL**
    - **Validates: Requirements 1.1, 1.4, 3.1, 3.3**

- [x] 3. Update annotation service to handle base64 screenshots

  - [x] 3.1 Modify create function in apps/api/src/services/annotations.ts
    - Check for screenshotAnnotatedBase64 in input
    - Call uploadBase64Screenshot if base64 provided
    - Store resulting URL in screenshotAnnotated field
    - _Requirements: 1.4, 6.2_
  - [ ]\* 3.2 Write property test for annotation data persistence
    - **Property 3: Annotation Data Persistence**
    - **Validates: Requirements 2.3, 2.4, 4.3**

- [x] 4. Update extension API client

  - [x] 4.1 Update CreateAnnotationData interface in apps/extension/src/api/annotations.ts
    - Replace screenshotBase64 with screenshotAnnotatedBase64
    - Remove canvasData field (not needed)
    - _Requirements: 2.3_

- [x] 5. Update extension save flow

  - [x] 5.1 Update saveTask function in apps/extension/src/content/actions.ts
    - Use screenshotAnnotatedBase64 field name
    - Remove canvasData from payload
    - Ensure proper error handling and button state management
    - _Requirements: 2.3, 2.5, 2.6, 5.1, 5.2, 5.3, 5.4_
  - [ ]\* 5.2 Write property test for form validation
    - **Property 2: Form Validation Blocks Invalid Submissions**
    - **Validates: Requirements 2.1, 2.2**

- [x] 6. Checkpoint - Verify end-to-end flow
  - Test annotation creation from extension
  - Verify screenshot appears in dashboard
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Vercel Blob token must be configured in apps/api/.env as BLOB_READ_WRITE_TOKEN
- The extension already has workspace/project selection UI implemented
- Dashboard already displays annotations with screenshots
