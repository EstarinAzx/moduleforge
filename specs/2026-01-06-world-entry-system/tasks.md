# Implementation Tasks: World and Entry System

> **Spec**: [spec.md](./spec.md)

## Overview
This document breaks down the World → Entry architecture transformation into granular tasks. This refactors the existing Module system into a hierarchical World/Entry structure.

---

## 1. Database - Schema Migration

### Rename Module → World
- [x] Update `prisma/schema.prisma`: Rename `Module` model to `World`
- [x] Add `coverImageUrl` (String?) field to World model
- [x] Update User relation: Change `ownedModules` to `ownedWorlds`
- [x] Keep all existing fields: id, title, description, content, metadata, visibility, ownerId, deletedAt, createdAt, updatedAt

### Create Entry Model
- [x] Add new `Entry` model to Prisma schema with fields:
  - id (cuid), worldId (String), type (String), title (String), description (String?)
  - content (Text), metadata (Json?), coverImageUrl (String?)
  - deletedAt (DateTime?), createdAt (DateTime), updatedAt (DateTime)
- [x] Add relation: `world World @relation(fields: [worldId], references: [id], onDelete: Cascade)`
- [x] Add relation to World: `entries Entry[]`
- [x] Add index on `worldId` for query performance

### Run Migration
- [x] Run `npx prisma db push` to apply schema changes (or `prisma migrate dev --name world_entry_system`)
- [x] Regenerate Prisma Client: `npx prisma generate`
- [x] Verify existing module data is preserved as worlds

---

## 2. Backend - World Routes Refactor

### Rename Files and Imports
- [x] Rename `src/routes/module.routes.ts` → `src/routes/world.routes.ts`
- [x] Update all `prisma.module` → `prisma.world` references
- [x] Update route registration in `server.ts`: `app.use('/api/worlds', worldRoutes)`
- [x] Remove old `/api/modules` route registration

### Update World CRUD Endpoints
- [x] Update POST `/api/worlds` - Create world (add coverImageUrl support)
- [x] Update GET `/api/worlds` - List user's worlds (keep pagination, search)
- [x] Update GET `/api/worlds/:id` - Get world (add entry count aggregation)
- [x] Update PATCH `/api/worlds/:id` - Update world (add coverImageUrl)
- [x] Update DELETE `/api/worlds/:id` - Soft delete world (cascade handled by Prisma)

### Add Entry Count to World Response
- [x] When fetching single world, include entry counts by type:
  ```json
  { "entryCounts": { "character": 5, "location": 3, "item": 10 } }
  ```
- [x] Use Prisma `groupBy` or separate count queries for each type

---

## 3. Backend - Entry CRUD Routes

### Create Entry Routes File
- [x] Create `src/routes/entry.routes.ts`
- [x] Apply auth middleware to all routes
- [x] Import sanitize-html config from world routes (or create shared util)

### POST /api/worlds/:worldId/entries - Create Entry
- [x] Validate worldId exists and user owns the world
- [x] Validate request body: type (required, one of 6 types), title (1-100 chars), description (optional, max 500)
- [x] Set initial metadata based on entry type (default fields structure)
- [x] Create entry with ownerId from world ownership
- [x] Return created entry

### GET /api/worlds/:worldId/entries - List Entries
- [x] Validate user owns the world
- [x] Accept query params: `type` (filter by type), `search`, `page`, `limit`
- [x] Filter by type if provided
- [x] Search by title and description (case-insensitive)
- [x] Exclude soft-deleted entries
- [x] Order by updatedAt DESC
- [x] Return paginated response with total count

### GET /api/worlds/:worldId/entries/:entryId - Get Single Entry
- [x] Validate user owns the world (via entry.world.ownerId)
- [x] Return 404 if entry not found or deleted
- [x] Return full entry object with content and metadata

### PATCH /api/worlds/:worldId/entries/:entryId - Update Entry
- [x] Validate ownership
- [x] Accept partial updates: title, description, content, metadata, coverImageUrl
- [x] Sanitize HTML content before saving
- [x] Validate title (1-100 chars) and description (max 500 chars)
- [x] Return updated entry

### DELETE /api/worlds/:worldId/entries/:entryId - Soft Delete Entry
- [x] Validate ownership
- [x] Set deletedAt = new Date()
- [x] Return success response

### GET /api/worlds/:worldId/entries/search - Entry Quick Search
- [x] Lightweight search for entry linking autocomplete
- [x] Return only id, title, type for matching entries
- [x] Limit to 10 results
- [x] Search by title (partial, case-insensitive)

### Route Registration
- [x] Register entry routes in `server.ts`: `app.use('/api/worlds', entryRoutes)`
- [x] Ensure routes are nested correctly (worldId in path)

### Update Sanitize Config
- [x] Add `data-entry-link` to allowed attributes for `<a>` tags
- [x] This enables entry cross-linking in Tiptap content

---

## 4. Frontend - API Client Updates

### Rename Module API → World API
- [x] Rename `src/api/modules.ts` → `src/api/worlds.ts`
- [x] Update function names: `createModule` → `createWorld`, etc.
- [x] Update API endpoints from `/api/modules` → `/api/worlds`
- [x] Export: `createWorld`, `getWorlds`, `getWorld`, `updateWorld`, `deleteWorld`

### Add Entry API Functions
- [x] Create `src/api/entries.ts` (or add to worlds.ts)
- [x] `createEntry(worldId, { type, title, description })` - POST
- [x] `getEntries(worldId, { type?, search?, page?, limit? })` - GET
- [x] `getEntry(worldId, entryId)` - GET
- [x] `updateEntry(worldId, entryId, data)` - PATCH
- [x] `deleteEntry(worldId, entryId)` - DELETE
- [x] `searchEntries(worldId, query)` - GET (for linking autocomplete)

### Update React Query Keys
- [x] Update query keys from `['modules']` → `['worlds']`
- [x] Add query keys for entries: `['worlds', worldId, 'entries']`
- [x] Add query key for single entry: `['worlds', worldId, 'entries', entryId]`

---

## 5. Frontend - Dashboard Updates

### Rename ModuleCard → WorldCard
- [x] Rename `src/components/ModuleCard.tsx` → `WorldCard.tsx`
- [x] Update to handle world data (add entry count display)
- [x] Show entry count badge (e.g., "12 entries")
- [x] Update navigation: Click → `/worlds/:worldId` (not editor)

### Update Dashboard Page
- [x] Update imports from ModuleCard to WorldCard
- [x] Update query: `useQuery(['worlds'])` 
- [x] Update API calls to use world API
- [x] Change heading: "My Modules" → "My Worlds"
- [x] Update empty state text

### Rename CreateModuleModal → CreateWorldModal
- [x] Rename component file
- [x] Update form fields (add optional coverImageUrl input)
- [x] Update API call to createWorld
- [x] Update button text: "Create Module" → "Create World"
- [x] On success: Navigate to `/worlds/:worldId` (world overview, not editor)

---

## 6. Frontend - World Overview Page (NEW)

### Create WorldOverviewPage Component
- [x] Create `src/pages/WorldOverviewPage.tsx`
- [x] Add route: `/worlds/:worldId`
- [x] Fetch world data with `useQuery(['worlds', worldId])`
- [x] Fetch entries with `useQuery(['worlds', worldId, 'entries'])`
- [x] Show loading skeleton while fetching
- [x] Show 404 if world not found

### World Header Section
- [x] Display world title (large heading)
- [x] Display world description
- [x] Show cover image as banner (if coverImageUrl exists)
- [x] Edit settings button (opens modal to edit title, description, cover)
- [x] Delete world button (with confirmation)
- [x] Back to Dashboard link

### World Overview Content Section
- [x] Add expandable section for world overview content (Tiptap editor)
- [x] Use existing TiptapEditor component
- [x] Autosave world content (same pattern as module editor)
- [x] Collapsible: "World Lore & Notes"

### Entry List Section
- [x] Create `EntryList.tsx` component
- [x] Display entries as cards in grid layout
- [x] Type filter tabs: All, Characters, Locations, Items, Factions, Events, Lore
- [x] Search input (debounced, filters entries)
- [x] Pagination for large entry lists
- [x] Empty state: "No entries yet. Create your first entry!"

### Add Entry Button
- [x] "+ Add Entry" button (prominent CTA)
- [x] Opens CreateEntryModal

---

## 7. Frontend - Entry Components (NEW)

### EntryTypeIcon Component
- [x] Create `src/components/EntryTypeIcon.tsx`
- [x] Accept prop: `type: 'character' | 'location' | 'item' | 'faction' | 'event' | 'lore'`
- [x] Return appropriate emoji or icon:
  - Character: 👤 or User icon
  - Location: 📍 or MapPin icon
  - Item: ⚔️ or Package icon
  - Faction: 🏛️ or Users icon
  - Event: 📅 or Calendar icon
  - Lore: 📜 or BookOpen icon
- [x] Style with appropriate colors per type

### EntryCard Component
- [x] Create `src/components/EntryCard.tsx`
- [x] Display: Type icon, Title, Description (truncated)
- [x] Last modified date
- [x] Hover effect (lift, shadow increase)
- [x] Click to navigate: `/worlds/:worldId/entries/:entryId`
- [x] Action buttons on hover: Edit, Delete

### CreateEntryModal Component
- [x] Create `src/components/CreateEntryModal.tsx`
- [x] Type selector grid (6 types with icons and labels)
- [x] After type selection: Show title + description form
- [x] Validate: type required, title required (1-100 chars)
- [x] On submit: Call createEntry API
- [x] On success: Navigate to `/worlds/:worldId/entries/:entryId`

---

## 8. Frontend - Entry Editor Page

### Create EntryEditorPage Component
- [x] Create `src/pages/EntryEditorPage.tsx`
- [x] Add route: `/worlds/:worldId/entries/:entryId`
- [x] Fetch entry data with `useQuery(['worlds', worldId, 'entries', entryId])`
- [x] Show loading skeleton while fetching
- [x] Show 404 if entry not found or not authorized

### Breadcrumb Navigation
- [x] Show breadcrumb: World Title > Entry Title
- [x] World title links back to World Overview
- [x] Back button: Navigate to World Overview

### Entry Header
- [x] Display entry type icon + type label
- [x] Inline editable title (same pattern as old module editor)
- [x] Editable description (textarea)
- [x] Save status indicator

### Entry Content Editor
- [x] Reuse TiptapEditor component
- [x] Autosave every 3 seconds (debounced)
- [x] Same toolbar as module editor

### Entry Metadata Sidebar
- [x] Create `EntryMetadataSidebar.tsx` component
- [x] Display metadata fields based on entry type
- [x] Render default fields for the type (per spec)
- [x] "Add Custom Field" button
- [x] Each field: label, value input, delete button (for custom fields)
- [x] Save on blur or change

### Delete Entry
- [x] Delete button in editor (red, destructive)
- [x] Confirmation modal (same pattern as module delete)
- [x] On success: Navigate to World Overview

---

## 9. Frontend - Entry Type Metadata

### Default Metadata by Type
- [x] Create `src/lib/entryMetadata.ts` with default fields per type
- [x] Character: `[{ name: 'Age', type: 'number' }, { name: 'Species', type: 'text' }, { name: 'Status', type: 'dropdown', options: ['Alive', 'Dead', 'Unknown'] }]`
- [x] Location: `[{ name: 'Region', type: 'text' }, { name: 'Climate', type: 'dropdown', options: [...] }]`
- [x] Item: `[{ name: 'Rarity', type: 'dropdown' }, { name: 'Origin', type: 'text' }]`
- [x] Faction: `[{ name: 'Alignment', type: 'dropdown' }, { name: 'Leader', type: 'text' }]`
- [x] Event: `[{ name: 'Date', type: 'text' }, { name: 'Impact', type: 'text' }]`
- [x] Lore: `[{ name: 'Category', type: 'dropdown' }, { name: 'Era', type: 'text' }]`

### Initialize Entry Metadata
- [x] When creating entry, pre-populate metadata with type defaults (empty values)
- [x] Store as JSON array: `[{ id, name, type, value, options? }]`

### Metadata Field Components
- [x] Reuse or create field components: TextField, NumberField, DropdownField
- [x] Each field renders based on its type
- [x] Edit value inline
- [x] Custom fields can be deleted, default fields cannot

---

## 10. Frontend - Route Updates

### Update App.tsx Routes
- [x] Change `/modules/:id` route to Entry structure
- [x] Add route: `/worlds/:worldId` → WorldOverviewPage
- [x] Add route: `/worlds/:worldId/entries/:entryId` → EntryEditorPage
- [x] Remove old `/modules/:id` route
- [x] Ensure ProtectedRoute wraps all world/entry routes

### Update Navigation Links
- [x] Dashboard: Click WorldCard → `/worlds/:worldId`
- [x] WorldOverviewPage: Click EntryCard → `/worlds/:worldId/entries/:entryId`
- [x] EntryEditorPage: Back button → `/worlds/:worldId`
- [x] WorldOverviewPage: Back to Dashboard → `/dashboard`

---

## 11. Entry Linking (Tiptap Extension) - DEFERRED

> Entry linking (@mention autocomplete) is deferred to a future iteration. For MVP, users can manually link using standard links.

### Placeholder Tasks (Future)
- [ ] Create Tiptap Mention extension for entry linking
- [ ] Add autocomplete dropdown triggered by @ character
- [ ] Call `/api/worlds/:worldId/entries/search` for suggestions
- [ ] Insert as styled internal link with data-entry-link attribute

---

## 12. Testing & Verification

### Backend Testing
- [x] Test world CRUD endpoints with Postman
- [x] Test entry CRUD endpoints nested under world
- [x] Verify entry ownership through world ownership
- [x] Test cascade delete (delete world → entries deleted)
- [x] Test entry search and filtering by type

### Frontend Testing
- [x] Test dashboard shows worlds correctly
- [x] Test create world flow
- [x] Test world overview page displays entries
- [x] Test create entry with type selector
- [x] Test entry editor (title, description, content, metadata)
- [x] Test navigation flow: Dashboard → World → Entry → Back
- [x] Test delete world (confirm entries are gone)
- [x] Test delete entry

### Migration Testing
- [x] Verify existing module data is accessible as worlds
- [x] Verify no data loss during schema rename

---

## Implementation Order Recommendation

**Phase 1: Database & Backend (Days 1-2)** ✅ COMPLETE
1. Database schema migration (rename + new table)
2. Backend world routes refactor
3. Backend entry CRUD routes
4. Test with Postman

**Phase 2: Frontend API & Dashboard (Days 3-4)** ✅ COMPLETE
5. API client updates
6. Dashboard updates (WorldCard, CreateWorldModal)
7. Route updates

**Phase 3: World Overview Page (Days 5-6)** ✅ COMPLETE
8. WorldOverviewPage component
9. EntryCard and EntryList components
10. CreateEntryModal component
11. EntryTypeIcon component

**Phase 4: Entry Editor (Days 7-8)** ✅ COMPLETE
12. EntryEditorPage component
13. EntryMetadataSidebar component
14. Metadata field components
15. Type-specific default metadata

**Phase 5: Polish & Testing (Days 9-10)** ✅ COMPLETE
16. Styling and UX improvements
17. Testing and bug fixes

**Estimated Total**: 10-12 days for complete World/Entry system
**Actual Completion**: All core features implemented and verified
