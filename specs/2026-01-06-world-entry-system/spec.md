# Specification: World and Entry System

## Goal
Transform the flat Module architecture into a hierarchical World → Entry system where each World represents a universe/project containing multiple Entries (Characters, Locations, Items, Lore, etc.), enabling creators to organize interconnected worldbuilding content.

## User Stories
- As a creator, I want to create a World for my story/game so that I can organize all related content in one place
- As a creator, I want to add Entries (characters, locations, items) inside my World so that I can build interconnected lore
- As a creator, I want each Entry to have a type-specific structure so that characters have different fields than locations

---

## Specific Requirements

### World Entity (Replaces Module as Container)

**World Creation**
- User creates a World with: Title, Description, optional Cover Image URL
- World acts as a container/namespace for all related Entries
- Each World has its own overview page showing all Entries within it
- Worlds appear on the user's Dashboard (current module list becomes world list)
- World has visibility setting: private (default), shared (with invited users), public (future)

**World Overview Page**
- Displays World title, description, and cover image banner
- Shows list/grid of all Entries in the World
- Tab navigation or filters by Entry type (All, Characters, Locations, Items, etc.)
- Search Entries within the World
- "Add Entry" button opens type selector modal
- World settings accessible (edit title, description, delete)

**World-Level Rich Text**
- World has optional "Overview" rich text content (Tiptap editor)
- This is for general world lore, creation notes, or pinned information
- Separate from individual Entry content

### Entry Entity (Content Items Within World)

**Entry Types**
- Predefined types with distinct icons: Character, Location, Item, Faction, Event, Lore (generic)
- Each Entry belongs to exactly one World
- Entry has: Title, Type, Description, Content (rich text), Metadata (structured fields), optional Cover Image URL
- Entry types determine suggested metadata fields (but user can add custom fields)

**Default Metadata Fields by Type**
- **Character**: Age (number), Species (text), Affiliation (dropdown), Status (dropdown: Alive/Dead/Unknown)
- **Location**: Region (text), Climate (dropdown), Population (text)
- **Item**: Rarity (dropdown), Owner (link to Character entry), Origin (text)
- **Faction**: Alignment (dropdown), Leader (link to Character entry), Territory (link to Location entry)
- **Event**: Date (text), Participants (tags), Impact (text)
- **Lore**: Category (dropdown), Era (text)
- User can add additional custom metadata fields of any type

**Entry Editor Page**
- Same Tiptap rich editor as current module editor
- Sidebar shows metadata fields appropriate to Entry type
- "Add Field" button for custom metadata
- Entry links: Ability to reference other Entries in same World (renders as clickable link)
- Breadcrumb: World Title > Entry Title

### Database Schema Changes

**Rename Module → World**
- Rename `Module` model to `World` in Prisma schema
- Keep all existing fields: id, title, description, content, metadata, visibility, ownerId, deletedAt, createdAt, updatedAt
- Add optional `coverImageUrl` field

**New Entry Model**
- Create new `Entry` model with fields:
  - id (cuid)
  - worldId (foreign key to World)
  - type (String: 'character', 'location', 'item', 'faction', 'event', 'lore')
  - title (String, 1-100 chars)
  - description (String?, max 500 chars)
  - content (Text, HTML from Tiptap)
  - metadata (JSON, structured fields)
  - coverImageUrl (String?, optional)
  - deletedAt (DateTime?, for soft delete)
  - createdAt, updatedAt (DateTime)
- Relation: Entry belongs to World; World has many Entries
- Cascade delete: When World is deleted, all its Entries are deleted

### API Endpoint Changes

**Rename Module Routes → World Routes**
- `POST /api/worlds` - Create world
- `GET /api/worlds` - List user's worlds (with search, pagination)
- `GET /api/worlds/:id` - Get world with entry count by type
- `PATCH /api/worlds/:id` - Update world
- `DELETE /api/worlds/:id` - Soft delete world (cascades to entries)

**New Entry Routes (Nested under World)**
- `POST /api/worlds/:worldId/entries` - Create entry in world
- `GET /api/worlds/:worldId/entries` - List entries in world (with type filter, search, pagination)
- `GET /api/worlds/:worldId/entries/:entryId` - Get single entry
- `PATCH /api/worlds/:worldId/entries/:entryId` - Update entry
- `DELETE /api/worlds/:worldId/entries/:entryId` - Soft delete entry

**Entry Linking Endpoint**
- `GET /api/worlds/:worldId/entries/search?q=term` - Quick search for entry linking in editor

### Frontend Route Changes

**Updated Routes**
- `/dashboard` - Shows list of Worlds (renamed from modules)
- `/worlds/:worldId` - World overview page (new)
- `/worlds/:worldId/entries/:entryId` - Entry editor page (new, replaces `/modules/:id`)

**Navigation Flow**
1. Dashboard → Click World card → World Overview Page
2. World Overview → Click Add Entry → Type selector modal → Entry Editor
3. World Overview → Click Entry → Entry Editor
4. Entry Editor → Back to World Overview

### Frontend Component Changes

**Rename/Adapt Existing Components**
- `ModuleCard.tsx` → `WorldCard.tsx` (for dashboard)
- `CreateModuleModal.tsx` → `CreateWorldModal.tsx`
- Current module editor page → becomes Entry editor
- Dashboard shows Worlds instead of Modules

**New Components**
- `WorldOverviewPage.tsx` - Main page for a World, shows Entries
- `EntryCard.tsx` - Card for Entry in World overview (shows type icon, title, description)
- `CreateEntryModal.tsx` - Type selector + title/description form
- `EntryTypeIcon.tsx` - Renders icon based on entry type (Character, Location, etc.)
- `EntryMetadataSidebar.tsx` - Shows type-specific metadata fields
- `EntryList.tsx` - Displays entries with type filter tabs

**Tiptap Editor Reuse**
- Existing `TiptapEditor.tsx` reused for both World overview content and Entry content
- Add mention/link functionality for Entry references (`@CharacterName` syntax)

### Entry Linking (Cross-References)

**Link Syntax in Editor**
- User types `@` followed by Entry title to create a link
- Shows autocomplete dropdown with matching Entries from same World
- Inserted as special HTML: `<a href="/worlds/:worldId/entries/:entryId" data-entry-link="entryId">Entry Title</a>`
- Rendered as styled internal link (different color than external links)
- Backend sanitize-html configuration updated to allow data-entry-link attribute

**Backlinks Section**
- Each Entry shows "Referenced By" section listing Entries that link to it
- Computed dynamically or via reverse index (defer full implementation to later)

### Migration Strategy

**Database Migration**
- Rename `Module` table to `World` (preserve data)
- Create new `Entry` table
- Run Prisma migration

**Existing Data Handling**
- Existing Modules become Worlds (no data loss)
- Their content remains as World overview content
- Users can later create Entries within these Worlds

---

## Existing Code to Leverage

**Backend - Module Routes**
- `module.routes.ts` - Rename to `world.routes.ts`, update model references
- Reuse: Auth middleware, sanitize-html config, validation patterns, pagination logic

**Backend - Prisma Setup**
- `lib/prisma.ts` - No changes needed
- Schema update: Rename Module, add Entry model

**Frontend - Tiptap Editor**
- `TiptapEditor.tsx` - Fully reusable for Entry content
- Add entry linking extension (new Tiptap extension)

**Frontend - Components**
- `ProtectedRoute.tsx` - No changes
- `ModuleCard.tsx` → Adapt to `WorldCard.tsx`
- Dashboard layout → Adapt to show Worlds

**Frontend - API Client**
- `api/modules.ts` → Rename to `api/worlds.ts`, add entry functions

---

## Out of Scope

- Image upload to cloud storage (coverImageUrl is just a URL field for now)
- Real-time collaboration on Entries
- Entry templates (predefined content structures)
- Version history for Entries
- Public sharing URLs for Worlds
- Collaborative editing (invitation system - separate spec)
- Export World as PDF/ZIP
- Advanced entry relationships (family trees, complex graphs)
- Full-text search across all Worlds
- Entry ordering/custom sorting
- Entry categories beyond predefined types
- Timeline view for Event entries
- Map integration for Location entries
- Backlinks computation (show list of referencing entries)
- Bulk operations (move entries, bulk delete)
