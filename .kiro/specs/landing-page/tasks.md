# Implementation Plan: Landing Page

## Overview

Setup Next.js app minimal di `apps/web` dengan dua halaman placeholder (landing dan auth), siap untuk deployment ke Vercel.

## Tasks

- [x] 1. Initialize Next.js project

  - [x] 1.1 Create Next.js app in apps/web directory
    - Initialize dengan `create-next-app` atau manual setup
    - Use App Router, TypeScript
    - _Requirements: 3.1, 3.2_
  - [x] 1.2 Configure package.json for pnpm workspace
    - Set package name to "@repo/web"
    - Add necessary scripts (dev, build, start)
    - _Requirements: 3.3_
  - [x] 1.3 Add Vercel configuration
    - Create vercel.json dengan basic config
    - _Requirements: 3.4_

- [x] 2. Create placeholder pages

  - [x] 2.1 Create root layout
    - Setup basic HTML structure di src/app/layout.tsx
    - _Requirements: 1.1_
  - [x] 2.2 Create landing page
    - Create src/app/page.tsx dengan placeholder text
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 2.3 Create auth page
    - Create src/app/auth/page.tsx dengan placeholder text
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Verify setup
  - [x] 3.1 Test local development
    - Run dev server dan verify kedua halaman accessible
    - _Requirements: 1.1, 2.1_

## Notes

- Tidak ada test tasks karena ini pure placeholder tanpa business logic
- Focus pada setup yang benar untuk deployment
- Styling minimal, bisa di-enhance nanti
