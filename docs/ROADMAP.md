# XiaozhiBlog Product Roadmap

> Version: v1 (2026-03-25)
> Goal: Build an iOS-style personal blog that is beautiful, complete, and production-ready.

## Current Execution Status (Updated)

## Overall Phase Status

1. Phase 1 - UI Foundation: In Progress
2. Phase 2 - Core Content Features: Partially Completed
3. Phase 3 - Discoverability and Operations: Partially Completed
4. Phase 4 - Quality, Security, Performance: Not Started
5. Phase 5 - Release and Continuous Delivery: Not Started

## Completed Baseline (Already Implemented)

1. Authentication and role boundary (visitor vs author write operations).
2. Post CRUD API and UI flow.
3. Markdown rendering in detail/editor preview.
4. Search by keyword, tag, and category.
5. Pagination and pinned posts ordering.
6. Post view counter.
7. Comment listing and submission.
8. Basic responsive behavior and light/dark theme toggle.

## In Progress Now

1. iOS-style visual refactor for core pages and components.
2. Unified design tokens and stronger visual consistency.

## Iteration A Progress (Current)

1. Completed: replaced major inline styles with reusable UI classes.
2. Completed: added loading state and empty state for post list.
3. Completed: added theme persistence (`hx_theme`) to keep user preference.
4. Completed: improved action hierarchy (secondary/danger buttons).
5. Remaining in Iteration A: final polish for login/list/detail/editor spacing and visual rhythm.

## Next 2 Iterations (Execution Queue)

1. Iteration A (current): finish iOS-style UI baseline for login/list/detail/editor.
2. Iteration B (next): add post status workflow (draft/published/archived) and comment moderation.

## Product Vision

1. Visual: iOS-inspired interface (clean spacing, soft shadows, rounded corners, frosted glass, smooth motion).
2. Functional: Full blog features for both author and visitors.
3. Engineering: Maintainable architecture, reliable delivery, and deployment-ready workflows.

## Phase Plan

## Phase 1 - UI Foundation (Week 1-2)

### Objectives

1. Build a design system (color, typography, spacing, radius, shadow, motion).
2. Standardize core components (button, input, card, modal, nav, tag, pagination).
3. Refactor key pages (login, list, detail, editor) to iOS style.

### Deliverables

1. Shared style tokens in CSS variables. [In Progress]
2. Reusable UI component styles and utility classes. [In Progress]
3. Responsive layout for desktop and mobile. [Completed - baseline]
4. Light and dark themes with consistent visual hierarchy. [Completed - baseline, needs visual polish]

### Definition of Done

1. Core pages are visually consistent.
2. Mobile usability is acceptable on common screen sizes.
3. No obvious layout shifting on first load.

## Phase 2 - Core Content Features (Week 3-4)

### Objectives

1. Improve publishing workflow: draft, publish, archive.
2. Enhance metadata: cover image, summary, slug, SEO description.
3. Upgrade taxonomy and comments: category/tag management, moderation.

### Deliverables

1. Post status support with clear UI actions. [Not Started]
2. Category and tag management views. [Partially Completed]
3. Comment moderation pipeline (pending, approved, rejected). [Not Started]
4. Basic anti-spam and input validation. [Partially Completed]

### Definition of Done

1. Author can fully manage article lifecycle.
2. Visitor can browse and comment with stable experience.
3. All critical write actions provide clear feedback and error states.

## Phase 3 - Discoverability and Operations (Week 5-6)

### Objectives

1. Better discovery: full-text search, related posts, hot posts.
2. Improve profile and about pages.
3. Add lightweight analytics and operations dashboard.

### Deliverables

1. Search across title/content/tags. [Completed]
2. About page with author profile and links.
3. Basic metrics: page views, popular posts, trend snapshots.

### Definition of Done

1. Users can discover relevant content quickly.
2. Author can inspect content performance.
3. Navigation depth and retention are measurably improved.

## Phase 4 - Quality, Security, Performance (Week 7-8)

### Objectives

1. Harden auth and validation.
2. Improve rendering and API performance.
3. Add test coverage for critical paths.

### Deliverables

1. Token expiration handling and refresh strategy.
2. Rate limiting for login and key write APIs.
3. Better cache and asset loading strategy.
4. API tests and E2E tests for login, publish, edit, comment.

### Definition of Done

1. Core user flows pass reliably.
2. Main security risks are mitigated.
3. Regression risk is controlled with automated tests.

## Phase 5 - Release and Continuous Delivery (Week 9-10)

### Objectives

1. Standardize deployment and rollback.
2. Improve SEO and accessibility.
3. Establish iterative release rhythm.

### Deliverables

1. Environment split (dev, test, prod).
2. One-command deploy and backup scripts.
3. SEO baseline (sitemap, robots, metadata) and accessibility baseline.
4. Bi-weekly release planning process.

### Definition of Done

1. Service can be deployed and rolled back reliably.
2. Search engines can index key pages.
3. Team (or solo workflow) has predictable delivery cadence.

## Prioritization Rules

## Must-Have

1. Auth and role boundaries.
2. Post CRUD and publishing lifecycle.
3. Comment moderation.
4. Responsive UI and theme consistency.

## Should-Have

1. Analytics dashboard.
2. SEO metadata management.
3. Better taxonomy operations.

## Could-Have

1. Scheduled publishing.
2. Recommendation strategy.
3. Subscription and notifications.
4. AI-assisted writing helpers.

## Development Protocol

1. All new features map to one phase and one objective.
2. Every feature change includes acceptance criteria.
3. High-impact changes require a quick regression checklist.
4. Keep README concise and roadmap as the source of truth.
