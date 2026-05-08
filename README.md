# ModuleForge

A privacy-first, owner-controlled wiki platform for creative worldbuilders, writers, RPG game masters, and game designers. Every "module" — whether a character, location, item, or concept — belongs to its creator, who decides exactly who can collaborate.

## Why ModuleForge

Traditional wikis are too open. Note-taking apps lack interconnection. Shared docs give everyone equal access. ModuleForge combines the rich, interconnected structure of a wiki with the controlled collaboration of modern document tools.

| Traditional Wiki | ModuleForge |
|------------------|-------------|
| Open editing by default | Owner-controlled by default |
| Rigid page structure | Structured metadata + free-form content |
| Text-focused | Rich media: images, galleries, embeds |
| Global permissions | Per-module invitation-based collaboration |

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS v4, Tiptap, TanStack Query, Zustand, React Router, Radix UI / shadcn
- **Backend**: Node.js (v22 LTS), Express, TypeScript, Prisma 7, JWT auth, Multer + Cloudinary
- **Database**: PostgreSQL (Supabase for MVP, Neon for production)
- **Hosting**: Vercel (frontend) + Railway (backend)

## Repository Layout

```
moduleforge/
├── src/
│   ├── backend/       # Express + Prisma API
│   └── frontend/      # React + Vite SPA
├── product/           # Mission, roadmap, tech-stack docs
├── specs/             # Feature specifications
└── CHANGELOG-*.md     # Session changelogs
```

## Core Concepts

- **Workspaces** — separate "universes" for different projects
- **Worlds** — top-level containers grouping related content
- **Entries** — Characters, Locations, Items, Factions, or Custom modules
- **Lore** — Wiki-style articles organized by category
- **Timeline** — Chronological events with importance levels
- **Relationship Map** — Visual graph linking entries, with 4-handle nodes for flexible connections

## Status

MVP authentication, module CRUD, dashboard, and search are complete. In progress: structured metadata (custom fields), media uploads, and Version 1.0 collaboration features (invitations, permissions, activity log, relationship graph).

See [`product/roadmap.md`](product/roadmap.md) for the full plan.

## Documentation

- [Mission](product/mission.md) — vision, target users, differentiators
- [Tech Stack](product/tech-stack.md) — versions, rationale, alternatives
- [Roadmap](product/roadmap.md) — MVP through v2.0 features
- [Specs](specs/) — detailed feature specifications
