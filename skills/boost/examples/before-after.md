# Boost — Before & After Examples

7 complete examples showing how /boost transforms a raw prompt into a structured, context-rich prompt. Each example shows the detection reasoning and discovered context.

---

## Example 1: Debug

**Raw prompt:** `fix the login page it keeps crashing when I click submit /boost`

**Detection:** Debug — keywords "fix" (1 match) + "crashing" (1 match) = 2 matches. No other category exceeds 2.

**Context discovered:**
- package.json → Next.js 14, TypeScript, Prisma, PostgreSQL
- git log → auth middleware updated 2 days ago (commit abc123)
- File scan → src/app/login/page.tsx (238 lines), src/lib/auth.ts (145 lines)
- boost-patterns.md → "login page" not in aliases (candidate for suggestion)

**Boosted prompt:**
```
## Task: Fix crash on login form submission
## Type: Debug
## Context:
  - Project: Next.js 14 app with TypeScript
  - Tech stack: React, Prisma, PostgreSQL
  - Recent changes: auth middleware updated 2 days ago (commit abc123)
  - Related files: src/app/login/page.tsx, src/lib/auth.ts
## Symptoms: Login page crashes on submit button click
## Expected Behavior: Form submits successfully and authenticates user
## Actual Behavior: Crash/error occurs on form submit
## Investigation Starting Points:
  - Form submit handler in login page component
  - Auth middleware (recently changed — likely culprit)
  - Network requests triggered on form submit
## Constraints:
  - Do not modify existing auth API contracts
  - Maintain existing test coverage
## Success Criteria:
  - Login form submits without crashing
  - All existing auth tests still pass
  - Root cause identified and fixed
```

**Post-execution suggestion:** "Boost noticed a term it could add: 'login page' = src/app/login/page.tsx. Add to boost-patterns.md?"

---

## Example 2: Refactor

**Raw prompt:** `/boost clean up the utils folder it's a mess`

**Detection:** Refactor — keywords "clean up" (1) + "mess" (1) = 2 matches.

**Context discovered:**
- package.json → React app with TypeScript
- File scan → src/utils/ has 12 files: formatDate.ts, validateEmail.ts, apiClient.ts, constants.ts, helpers.ts, etc.
- boost-patterns.md → no alias for "utils"

**Boosted prompt:**
```
## Task: Reorganize utils folder for clarity and maintainability
## Type: Refactor
## Context:
  - Project: React app with TypeScript
  - Tech stack: React, axios, date-fns
  - Related files: src/utils/ (12 files, mixed concerns)
## Current State: Utils folder contains mixed concerns — date formatting, email validation, API client, constants, and generic helpers in a flat structure
## Target State: Organized by domain with clear module boundaries
## Boundaries: All existing imports must continue to work; no behavior changes
## Constraints:
  - Preserve all existing behavior and exports
  - Update all import paths across the project
  - Maintain test coverage
## Success Criteria:
  - Each utils file has a single clear responsibility
  - All existing tests pass without modification
  - No behavior changes in consuming code
```

---

## Example 3: Feature

**Raw prompt:** `add dark mode to settings page /boost`

**Detection:** Feature — keyword "add" (1 match).

**Context discovered:**
- package.json → Next.js 14, tailwindcss, next-themes already installed
- File scan → src/app/settings/page.tsx exists, src/styles/globals.css uses CSS variables
- boost-patterns.md → "settings page" = src/app/settings/

**Boosted prompt:**
```
## Task: Add dark mode toggle to the settings page
## Type: Feature
## Context:
  - Project: Next.js 14 with TypeScript
  - Tech stack: React, tailwindcss, next-themes (already installed)
  - Related files: src/app/settings/page.tsx, src/styles/globals.css, tailwind.config.ts
  - Team conventions: Use CSS variables for theming
## Requirements: Toggle switch in settings that switches between light and dark themes
## Acceptance Criteria:
  - Toggle persists across sessions (localStorage or user preferences)
  - All existing components respect the theme
  - No flash of wrong theme on page load
## Edge Cases:
  - System preference changes while app is open
  - Components with hardcoded colors that bypass theme
## Integration Points: Global layout, CSS variables, next-themes provider
## Constraints:
  - Follow existing styling patterns (tailwindcss)
  - Use next-themes since it's already installed
## Success Criteria:
  - Dark mode toggle works from settings
  - Theme persists across refreshes
  - No visual regressions
```

---

## Example 4: Review

**Raw prompt:** `look at the payment module for security issues /boost`

**Detection:** Review — keywords "look at" (1) + no other category matches.

**Context discovered:**
- package.json → Express.js, Stripe SDK, Prisma
- File scan → src/payments/ (8 files), src/middleware/auth.ts
- boost-patterns.md → "All API inputs validated with zod"

**Boosted prompt:**
```
## Task: Security review of the payment module
## Type: Review
## Context:
  - Project: Express.js API with TypeScript
  - Tech stack: Stripe SDK, Prisma, PostgreSQL
  - Related files: src/payments/, src/middleware/auth.ts
  - Team conventions: All API inputs validated with zod
## Scope: All files in src/payments/ and related auth middleware
## Focus Areas:
  - Security: injection, auth bypass, data exposure, PCI compliance
  - Input validation: payment amounts, currency codes, card tokens
  - Error handling: payment errors without leaking sensitive data
  - Logging: card numbers or tokens accidentally logged?
## Output Format:
  - Findings by severity: critical, warning, suggestion
  - File path and line number per finding
  - Fix suggestions for critical and warning items
## Constraints:
  - Focus on security, not code style
## Success Criteria:
  - All critical security issues identified
  - Actionable fixes provided
```

---

## Example 5: Test

**Raw prompt:** `write tests for the checkout flow /boost`

**Detection:** Test — keywords "tests" (1) + no other category exceeds.

**Context discovered:**
- package.json → vitest, testing-library/react, MSW
- File scan → src/app/checkout/page.tsx, src/lib/cart.ts, src/api/orders.ts
- boost-patterns.md → "Tests in __tests__/ next to source, use MSW for API mocks"

**Boosted prompt:**
```
## Task: Write tests for the checkout flow
## Type: Test
## Context:
  - Project: Next.js 14 with TypeScript
  - Tech stack: vitest, testing-library/react, MSW
  - Related files: src/app/checkout/page.tsx, src/lib/cart.ts, src/api/orders.ts
  - Team conventions: Tests in __tests__/ next to source, use MSW for API mocks
## Test Targets: Checkout page, cart calculations, order API integration
## Test Types:
  - Unit: cart total, discount, tax calculations
  - Integration: checkout form → order creation → confirmation
  - Component: checkout page with various cart states
## Edge Cases:
  - Empty cart attempting checkout
  - Quantity of 0 or negative
  - Discount exceeding cart total
  - API timeout during order creation
## Mocking Strategy: MSW for API endpoints, real cart logic
## Constraints:
  - vitest + testing-library patterns
  - Tests in __tests__/ next to source
## Success Criteria:
  - Happy path and edge cases covered
  - Deterministic and fast (<5s)
  - All tests pass
```

---

## Example 6: Docs

**Raw prompt:** `/boost document the API endpoints`

**Detection:** Docs — keyword "document" (1 match).

**Context discovered:**
- package.json → Express.js, TypeScript
- File scan → src/api/routes/ (6 route files)
- boost-patterns.md → "OpenAPI/Swagger preferred for API docs"

**Boosted prompt:**
```
## Task: Document all API endpoints
## Type: Documentation
## Context:
  - Project: Express.js API with TypeScript
  - Related files: src/api/routes/ (6 route files)
  - Team conventions: OpenAPI/Swagger preferred
## Audience: Frontend developers and new backend team members
## Scope: All REST endpoints — method, path, params, body, response, errors
## Format: OpenAPI 3.0 spec (YAML) + human-readable reference
## Examples Needed:
  - Request/response per endpoint
  - Error response examples
  - Authentication header examples
## Constraints:
  - Match existing documentation style
## Success Criteria:
  - Every endpoint documented with method, path, params, body, response
  - Examples are valid and copy-pasteable
  - New developer can use any endpoint from docs alone
```

---

## Example 7: General

**Raw prompt:** `set up CI/CD for this project /boost`

**Detection:** General — no specific category keywords matched strongly. "set up" partially matches Feature ("setup") but the task is infrastructure, not a product feature.

**Context discovered:**
- package.json → Next.js 14, pnpm, vitest, ESLint
- git → deployed on Vercel (detected from vercel.json)
- boost-patterns.md → "Main branch is protected, PRs require review"

**Boosted prompt:**
```
## Task: Set up CI/CD pipeline for the project
## Type: General
## Context:
  - Project: Next.js 14 with TypeScript, deployed on Vercel
  - Tech stack: pnpm, vitest, ESLint, Prettier
  - Related files: package.json, vercel.json, .github/ (if exists)
  - Team conventions: Main branch protected, PRs require review
## Goal: Automated pipeline — lint, test, typecheck on every PR; auto-deploy on merge to main
## Approach:
  - GitHub Actions for CI (lint, test, typecheck on PR)
  - Vercel integration for CD (auto-deploy on merge)
  - Status checks required before merge
## Constraints:
  - Use pnpm (existing package manager)
  - Keep pipeline fast (<5 minutes)
## Success Criteria:
  - PRs automatically run lint, test, typecheck
  - Failed checks block merge
  - Merge to main triggers deployment
  - Pipeline under 5 minutes
```

---

## Example 8: Content Workspace — Create (non-code)

**Raw:** `write a newsletter about the new collection /boost`

**Boosted:**
```
## Task: Write launch newsletter for the new mug collection
## Type: Create
## Context:
  - Project: ceramics shop; voice per STYLE.md (warm, plainspoken)
  - Prior pieces: newsletters/2026-05-spring.md (tone reference)
  - Brand rules: never "artisanal"; one CTA only
## Brief: Announce 12 new mugs to the list; drive first-week orders
## Audience: Newsletter subscribers — already know the brand
## Tone / Style: per STYLE.md; first person singular
## Must Include: launch date, price + shipping, one photo block, single CTA
## Must Avoid: discount framing, "artisanal", multiple CTAs
## Length / Format: ~250 words, subject line + 3 short sections
## Success Criteria:
  - Subject line under 45 chars; reader knows what/when/how much in one scroll
```

Note the domain hint: no package.json in this workspace, so "write" routes to Create (general file), not Feature.

## Example 9: Content Workspace — Research (non-code)

**Raw:** `research which email tool we should switch to /boost`

**Boosted:**
```
## Task: Recommend an email platform to replace the current one
## Type: Research
## Context:
  - Project: shop marketing ops; current tool exports available in ops/
  - Existing notes: research/email-tools-2025.md (last year's comparison)
## Question: Which email platform should we switch to for <2k subscribers on a small budget?
## Scope: In — pricing, automation, migration effort. Out — enterprise tools, self-hosted.
## Sources: official pricing pages, credible reviews; verify against last year's notes
## Deliverable: comparison table + ONE recommendation with reasoning
## Confidence & Gaps: state confidence and what wasn't verifiable
## Success Criteria:
  - Direct answer with cited sources; migration steps sketched for the winner
```
