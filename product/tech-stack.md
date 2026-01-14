# Tech Stack

## Recommended Versions (January 2025)

| Technology | Version | Notes |
|-----------|---------|-------|
| **Node.js** | v22.x LTS (minimum v20.19) | Required for Prisma 7 |
| **TypeScript** | v5.9.x (minimum v5.4) | Recommended for Prisma compatibility |
| **React** | v19.2.0 | Latest stable with compiler optimizations |
| **Vite** | v7.0.0 | Latest stable, fully React 19 compatible |
| **Tailwind CSS** | v4.0 | Latest with native Vite plugin |
| **Prisma** | v7.0.0+ | Latest with PostgreSQL adapter support |
| **PostgreSQL** | v14+ | Recommended for production |

### Browser Support
With Tailwind CSS v4, targeting modern browsers:
- **Chrome 111+** (released March 2023)
- **Safari 16.4+** (released March 2023)
- **Firefox 128+** (released July 2024)

> [!IMPORTANT]
> **Tailwind v4 Requirements**: Tailwind CSS v4 requires modern CSS features like `@property` and `color-mix()`. These browser versions are mandatory for core functionality.

### Version Compatibility Requirements
- **Prisma 7** requires Node.js 20.19+ and TypeScript 5.4+
- **React 19** works seamlessly with Vite 7.0.0
- **PostgreSQL adapter** (`@prisma/adapter-pg`) required for Prisma 7

---

## Frontend

### Core Framework: **React with TypeScript**
- **Why**: Component-based architecture ideal for modular UI, strong ecosystem, TypeScript for type safety
- **Alternatives considered**: Vue.js (smaller ecosystem), Svelte (less mature for complex apps)

### Build Tool: **Vite**
- **Why**: Lightning-fast HMR, modern build tool optimized for React/TypeScript, simple config
- **Alternatives considered**: Create React App (deprecated), Next.js (overkill for SPA unless we need SSR)

### Styling: **Tailwind CSS v4**
- **Why**: 
  - Modern architecture with native Vite plugin (`@tailwindcss/vite`)
  - Improved performance and DX over v3
  - Automatic PostCSS and Autoprefixer handling
  - Rapid UI development with consistent design system
- **Setup**: Use `@tailwindcss/vite` plugin (no PostCSS config needed)
- **Alternatives considered**: Tailwind v3 (older architecture), Vanilla CSS (slower iteration), styled-components (runtime overhead)

### Rich Text Editor: **Tiptap** or **Lexical**
- **Why**: 
  - Tiptap: Prosemirror-based, excellent extensibility, supports custom blocks
  - Lexical: Meta-backed, modern architecture, great performance
- **Decision**: Tiptap for MVP (more mature), evaluate Lexical for v2.0
- **Alternatives considered**: Quill (limited customization), Draft.js (deprecated)

### State Management: **TanStack Query (React Query) + Zustand**
- **Why**: 
  - React Query for server state (caching, refetching, optimistic updates)
  - Zustand for minimal client state (UI state, user preferences)
- **Alternatives considered**: Redux (too verbose), Context API (performance issues at scale)

### Routing: **React Router v6**
- **Why**: Industry standard, declarative routing, nested routes for dashboard/module views
- **Alternatives considered**: TanStack Router (newer, less mature)

### Form Handling: **React Hook Form + Zod**
- **Why**: Minimal re-renders, excellent validation with Zod schemas, TypeScript integration
- **Alternatives considered**: Formik (heavier), manual state (error-prone)

### UI Component Library: **Radix UI + shadcn/ui**
- **Why**: Unstyled, accessible primitives (Radix) + beautiful Tailwind components (shadcn)
- **Alternatives considered**: Material UI (opinionated design), Chakra UI (heavier bundle)

---

## Backend

### Runtime: **Node.js with TypeScript**
- **Why**: Shared language with frontend, massive ecosystem, async I/O for real-time features
- **Alternatives considered**: Python/Django (slower iteration), Go (steeper learning curve)

### Framework: **Express.js**
- **Why**: Lightweight, flexible, well-documented, easy to add middleware
- **Alternatives considered**: Fastify (less ecosystem), NestJS (too opinionated for MVP)

### ORM: **Prisma**
- **Why**: Type-safe database access, excellent migrations, auto-generated client, supports multiple DBs
- **Alternatives considered**: TypeORM (verbose), raw SQL (slow development)

### Authentication: **JWT (JSON Web Tokens)**
- **Libraries**: `jsonwebtoken` for token generation, `bcryptjs` for password hashing
- **Why**: Stateless, scalable, works well with REST APIs
- **Alternatives considered**: Session-based (requires Redis for scaling), OAuth only (requires third-party)

### File Upload: **Multer + Cloud Storage**
- **Why**: Multer handles multipart/form-data, cloud storage for scalability
- **Cloud Options**: 
  - MVP: **Cloudinary** (free tier, image optimization built-in)
  - Production: AWS S3 or Vercel Blob (cost-effective at scale)
- **Alternatives considered**: Local file storage (not scalable), third-party API (vendor lock-in)

### Real-time (Future): **Socket.io**
- **Why**: Real-time collaborative editing, activity notifications
- **When**: Version 1.0 (collaboration features)
- **Alternatives considered**: WebSockets (raw, more complex), Pusher (expensive)

---

## Database

### Primary Database: **PostgreSQL**
- **Why**: 
  - Relational model fits module structure (users, modules, collaborators, fields)
  - JSONB columns for flexible custom fields
  - Full-text search capabilities
  - Mature, battle-tested, excellent Prisma support
- **Alternatives considered**: 
  - MongoDB (less ideal for complex relationships)
  - MySQL (weaker JSON support)

### Hosting: **Supabase** (MVP) or **Neon** (Production)
- **Why**: 
  - Supabase: Free tier, built-in auth (if needed), real-time subscriptions, edge functions
  - Neon: Serverless Postgres, auto-scaling, better for production cost optimization
- **Migration path**: Start with Supabase, evaluate Neon if costs grow
- **Alternatives considered**: Self-hosted Postgres (more DevOps overhead), PlanetScale (MySQL-based)

---

## Infrastructure

### Hosting

#### Frontend: **Vercel** or **Netlify**
- **Why**: Zero-config deployment for Vite apps, edge CDN, preview deployments, free tier
- **Preference**: Vercel (better with Next.js if we migrate later)
- **Alternatives considered**: AWS Amplify (more complex), GitHub Pages (no SSR support)

#### Backend: **Railway** or **Render**
- **Why**: 
  - Railway: Simple Postgres + Node deployment, free tier, excellent DX
  - Render: Similar to Railway, auto-deploy from Git, free tier
- **Decision**: Railway for MVP (simpler), evaluate AWS/GCP for scale
- **Alternatives considered**: Heroku (expensive), DigitalOcean (more manual setup)

### CI/CD: **GitHub Actions**
- **Why**: Free for public repos, integrated with GitHub, flexible workflows
- **Use cases**: Run tests, type-checking, linting on PRs; auto-deploy on merge to main
- **Alternatives considered**: GitLab CI (not using GitLab), CircleCI (paid)

---

## Development Tools

### Monorepo Management: **pnpm Workspaces**
- **Why**: Faster than npm/yarn, efficient disk usage, workspace support for frontend/backend
- **Alternatives considered**: Yarn workspaces (slower), Turborepo (overkill for 2 packages)

### Code Quality
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode
- **Pre-commit**: Husky + lint-staged

### Testing
- **Unit/Integration**: **Vitest** (frontend), **Jest** (backend if needed)
  - Why: Vitest is Vite-native, faster than Jest for frontend
- **E2E (Future)**: **Playwright**
  - Why: Multi-browser support, great debugging, TypeScript-first
- **API Testing**: **Supertest** (for Express routes)

---

## Optional Enhancements (Post-MVP)

### Search: **Meilisearch** or **Typesense**
- **When**: Version 1.5 (advanced search)
- **Why**: Full-text search with typo tolerance, faster than Postgres FTS at scale
- **Alternatives**: Algolia (expensive), Elasticsearch (heavy setup)

### Graph Visualization: **Cytoscape.js** or **vis.js**
- **When**: Version 1.0 (relationship graphs)
- **Why**: Interactive network graphs for module relationships

### Analytics: **PostHog** (self-hosted) or **Plausible**
- **Why**: Privacy-first, no cookies, insight into feature usage
- **Alternatives**: Google Analytics (privacy concerns), Mixpanel (expensive)

---

## Summary

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Frontend Framework** | React + TypeScript + Vite | Modern, fast, type-safe SPA |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid development with accessible components |
| **Editor** | Tiptap | Extensible rich text, great DX |
| **State** | React Query + Zustand | Optimal server/client state split |
| **Backend** | Express + TypeScript + Prisma | Lightweight, type-safe, fast iteration |
| **Database** | PostgreSQL (Supabase) | Relational + flexible JSON, excellent tooling |
| **Hosting** | Vercel (FE) + Railway (BE) | Zero-config, free tier, great DX |
| **Auth** | JWT + bcrypt | Stateless, scalable |
| **Storage** | Cloudinary | Free tier, image optimization |

This stack prioritizes **developer velocity** for MVP while maintaining **scalability** for future growth. All choices can be incrementally enhanced without major rewrites.
