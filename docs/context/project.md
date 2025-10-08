---
# Zeitgeist

**Vision:** AI-powered stock advisor that utilizes AI API and custom prompting to provide users with financial advice

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, Three.js (React Three Fiber), Aceternity UI components

**Status:** Framework initialization in progress

---

## Performance & Quality Directives

### Code Organization
- Functions < 50 lines
- Components follow single responsibility principle
- Consistent naming conventions (camelCase for functions, PascalCase for components)
- Proper TypeScript typing (avoid `any`)

### Performance
- Lazy load heavy components (especially Three.js)
- Image optimization with Next.js Image component
- Code splitting for route-based chunks
- Memoization for expensive computations

### Accessibility
- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus management for modals/overlays

### Security
- Environment variables for API keys
- Input sanitization
- Secure API route handling
- CORS configuration for external APIs

---

## Architecture Overview

### Directory Structure
```
/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   └── lib/
│       └── utils.ts
├── public/
├── .env.local
└── [config files]
```

### Key Technologies
- **UI Framework:** Aceternity UI (built on Framer Motion + Tailwind)
- **3D Graphics:** Three.js with React Three Fiber
- **Styling:** Tailwind CSS with custom animations
- **Type Safety:** TypeScript throughout

---

## Current Focus

**Feature:** Framework setup only (no features yet)
**Status:** Initializing Next.js with all required dependencies

---

## Project Learnings

### PL-001: Sidebar Text Flash on Expansion

**Discovered:** Bug-fix session, 2025-10-07

**Issue:**
Text in sidebar links disappeared briefly when expanding from collapsed state.

**Root Cause:**
Multiple issues:
1. Animating CSS `display` property from "none" to "inline-block" causes instant toggle
2. Container lacking overflow control during width animation
3. Text appearing before container fully expands

**Solution:**
- Add `overflow-hidden` to sidebar container
- Use simple opacity animation with delay
- Add `initial={{ opacity: 0 }}` to prevent flash on mount
- Change to `whitespace-nowrap` to prevent text reflow

**Prevention:**
Rule: For expand/collapse animations:
- Always add overflow control to animating containers
- Use opacity with appropriate delays for child content
- Avoid conditional CSS classes that change layout instantly

**Category:** Bug

---

## State

**Last Completed:** Fixed sidebar text flashing bug
**Next Task:** To be determined

---
