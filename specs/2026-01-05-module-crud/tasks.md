# Implementation Tasks: Module CRUD + Rich Editor

> **Spec**: [spec.md](./spec.md)

## Overview
This document breaks down the module CRUD and Tiptap editor specification into granular, implementable tasks grouped by specialty. Tasks assume authentication is already implemented.

---

## 1. Database Schema - Module Table

### Prisma Schema Updates
- [x] Add Module model to `prisma/schema.prisma`
- [x] Add fields: id (cuid), title (String), description (String?), content (Text), metadata (Json?), visibility (String default "private")
- [x] Add fields: ownerId (String), deletedAt (DateTime?), createdAt, updatedAt
- [x] Add relation to User: `owner User @relation("OwnedModules", fields: [ownerId], references: [id], onDelete: Cascade)`
- [ ] Add placeholder relation: `collaborators ModuleCollaborator[]` (for future)
- [ ] Run migration: `npx prisma migrate dev --name create_modules_table`
- [x] Regenerate Prisma Client: `npx prisma generate`

---

## 2. Backend - Module CRUD Routes

### Module Creation
- [x] Create `src/routes/module.routes.ts` file
- [x] Create POST `/api/modules` route with auth middleware
- [x] Validate request body (title required 1-100 chars, description optional max 500 chars)
- [x] Trim title before validation
- [x] Create module in database with ownerId from `req.user.userId`
- [x] Set initial values: content = '', metadata = null, visibility = 'private'
- [x] Return module object with all fields
- [x] Add error handling for validation errors

### List Modules
- [x] Create GET `/api/modules` route with auth middleware
- [x] Accept query params: `search`, `page` (default 1), `limit` (default 20)
- [x] Query modules where ownerId matches current user
- [x] Filter by search term if provided (title OR description contains search, case-insensitive)
- [x] Exclude modules where deletedAt is not null (if using soft delete)
- [x] Order by updatedAt DESC (newest first)
- [x] Implement offset-based pagination: `skip = (page - 1) * limit`, `take = limit`
- [x] Count total matching modules for pagination
- [x] Return: `{ modules: [...], total, page, totalPages: Math.ceil(total / limit) }`

### Get Single Module
- [x] Create GET `/api/modules/:id` route with auth middleware
- [x] Query module by id
- [x] Return 404 if module not found
- [x] Check if ownerId matches current user, return 403 if not authorized
- [x] Return full module object with content and metadata

### Update Module
- [x] Create PATCH `/api/modules/:id` route with auth middleware
- [x] Query module by id and verify ownership (403 if not owner)
- [x] Accept partial updates: title?, description?, content?, metadata?
- [x] Validate title if provided (1-100 chars, trimmed)
- [x] Validate description if provided (max 500 chars)
- [x] Sanitize HTML content before saving (install `sanitize-html` package)
- [x] Configure sanitize-html to allow safe tags: p, h1, h2, h3, strong, em, ul, ol, li, a, blockquote, br, hr
- [x] Strip dangerous tags and attributes (script, onclick, onerror, etc.)
- [x] Update module in database
- [x] Return updated module object

### Delete Module
- [x] Create DELETE `/api/modules/:id` route with auth middleware
- [x] Query module by id and verify ownership
- [x] For soft delete: Update module set `deletedAt = new Date()`
- [ ] For hard delete: Use `prisma.module.delete({ where: { id } })`
- [x] Return: `{ success: true }`
- [x] Add error handling for not found and unauthorized

### Route Registration
- [x] Register module routes in `src/server.ts`: `app.use('/api/modules', moduleRoutes)`
- [ ] Test all endpoints with Postman/Thunder Client

---

## 3. Frontend - React Query Setup

### Install Dependencies
- [x] Install TanStack Query: `npm install @tanstack/react-query`
- [x] Install Tiptap: `npm install @tiptap/react @tiptap/pm @tiptap/starter-kit`
- [x] Install Tiptap extensions: `npm install @tiptap/extension-link @tiptap/extension-placeholder`
- [x] Install utility: `npm install lodash` (for debounce)

### Query Client Setup
- [x] Create `src/lib/queryClient.ts` with QueryClient configuration
- [x] Wrap app with QueryClientProvider in `src/main.tsx`
- [ ] Add React Query DevTools (optional): `npm install @tanstack/react-query-devtools`

### API Functions
- [x] Create `src/api/modules.ts` with module API functions
- [x] Create `createModule(title, description)` - POST /api/modules
- [x] Create `getModules(search?, page?, limit?)` - GET /api/modules with query params
- [x] Create `getModule(id)` - GET /api/modules/:id
- [x] Create `updateModule(id, data)` - PATCH /api/modules/:id
- [x] Create `deleteModule(id)` - DELETE /api/modules/:id
- [x] Use axios instance with auth token from context

---

## 4. Frontend - Dashboard Page

### Dashboard Layout
- [x] Update `src/pages/DashboardPage.tsx` (placeholder from auth)
- [x] Add header section: "My Modules" title
- [x] Add "Create Module" button (top right, shadcn/ui Button)
- [x] Add search input with debounced onChange (300ms delay)
- [ ] Add grid/list view toggle button (start with grid view only for MVP)
- [x] Create main content area for module cards

### Module List with React Query
- [x] Create `useQuery` hook for fetching modules: `useQuery(['modules', search, page], () => getModules(search, page))`
- [x] Implement search state with debounced API call using `lodash.debounce`
- [x] Implement pagination state (current page)
- [x] Show loading skeleton while fetching (shadcn/ui Skeleton)
- [x] Handle error state with error message
- [x] If modules empty and no search: Show empty state component

### Empty State Component
- [x] Create `src/components/EmptyState.tsx`
- [x] Display when no modules exist
- [x] Show ilustration/icon (use simple SVG or emoji)
- [x] Text: "No modules yet" + "Create your first module to get started"
- [x] "Create Module" CTA button
- [x] Different message for search with no results: "No modules found" + "Clear search" button

### Module Card Component
- [x] Create `src/components/ModuleCard.tsx`
- [x] Accept props: module, onDelete
- [x] Display: Title (h3), Description (truncated to 100 chars with ellipsis), Last modified date (formatted)
- [x] Use shadcn/ui Card component
- [x] Add hover effect: lift card (translate-y-1, shadow increase)
- [x] On card click: Navigate to `/modules/:id`
- [x] Add action buttons (visible on hover): Edit icon, Delete icon
- [x] Edit button navigates to editor, Delete button calls onDelete

### Pagination Component
- [x] Create `src/components/Pagination.tsx`
- [x] Display: Previous, page numbers, Next
- [x] Disable Previous on page 1, disable Next on last page
- [x] Use shadcn/ui Button for page buttons
- [ ] Update URL query params when page changes
- [x] Scroll to top when page changes

---

## 5. Frontend - Create Module Flow

### Create Module Modal
- [ ] Install shadcn/ui Dialog component
- [x] Create `src/components/CreateModuleModal.tsx`
- [x] Form fields: Title (required), Description (optional textarea)
- [x] Use React Hook Form + Zod for validation
- [x] Zod schema: title (min 1, max 100, trimmed), description (optional, max 500)
- [x] Create `useMutation` hook for creating module
- [x] On success: Invalidate 'modules' query, navigate to `/modules/:id` (new module editor)
- [x] Display validation errors inline
- [x] Loading state: Disable form during submission, show spinner on button

### Dashboard Integration
- [x] Add state for modal open/closed
- [x] "Create Module" button opens modal
- [x] Pass modal state and handlers to CreateModuleModal

---

## 6. Frontend - Module Editor Page

### Editor Page Layout
- [x] Create `src/pages/ModuleEditorPage.tsx`
- [x] Read module ID from URL params: `const { id } = useParams()`
- [x] Fetch module with useQuery: `useQuery(['module', id], () => getModule(id))`
- [x] Show loading skeleton while fetching
- [x] Show 404 message if module not found
- [x] Show 403 message if not authorized (though backend should prevent this)
- [ ] Layout: Sidebar (left, 300px) + Main editor area (remaining width)
- [x] Top bar: Back button (navigate to dashboard), Save status indicator

### Editable Title
- [x] Create inline editable title using contenteditable or input field
- [x] Initialize with module.title
- [x] Save on blur event
- [x] Create `useMutation` for update with optimistic updates
- [x] Show validation error if title empty or too long

### Editable Description
- [x] Create expandable textarea for description
- [x] Initialize with module.description
- [x] Save on blur event
- [x] Update mutation with optimistic updates

---

## 7. Frontend - Tiptap Editor Integration

### Editor Component
- [x] Create `src/components/TiptapEditor.tsx`
- [x] Accept props: initialContent, onUpdate
- [x] Install and configure StarterKit extensions
- [x] Add Link extension with openOnClick: false
- [x] Add Placeholder extension with placeholder text: "Start writing..."
- [x] Initialize editor with `useEditor()` hook
- [x] Load initial content: `editor.commands.setContent(initialContent || '')`
- [x] On update: Call `onUpdate(editor.getHTML())` (debounced 3 seconds)

### Toolbar Component
- [x] Create `src/components/EditorToolbar.tsx`
- [x] Accept prop: editor instance
- [x] Create heading dropdown: Paragraph, H1, H2, H3 (use shadcn/ui Select)
- [x] Use `editor.isActive('heading', { level: X })` to show current selection
- [x] On change: Call `editor.chain().focus().toggleHeading({ level }).run()` or `.setParagraph()`
- [x] Create Bold button: Uses `editor.chain().focus().toggleBold().run()`
- [x] Create Italic button: Uses `editor.chain().focus().toggleItalic().run()`
- [x] Create Bullet List button
- [x] Create Ordered List button
- [x] Create Blockquote button
- [x] Create Horizontal Rule button
- [x] Highlight active buttons using `editor.isActive('bold')` etc.
- [x] Make toolbar sticky (position sticky, top: 0)

### Link Handling
- [x] Create Link button in toolbar
- [x] On click: Show modal/dialog to input URL
- [x] Use shadcn/ui Dialog with input field
- [ ] Validate URL format (basic regex or allow any string)
- [x] Insert link: `editor.chain().focus().setLink({ href: url }).run()`
- [ ] For editing existing link: Show current URL in input, allow edit or remove
- [x] Remove link button: `editor.chain().focus().unsetLink().run()`
- [x] Configure Link extension with `HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' }`

### Editor Styling
- [ ] Add Tailwind typography plugin: `npm install @tailwindcss/typography`
- [x] Wrap editor content in `prose` class from typography plugin
- [x] Style editor container: min-h-96 (400px), border, rounded, padding
- [x] Add focus ring styling
- [x] Customize prose styles for headings (bold, larger sizes)
- [x] Style lists with proper indentation
- [x] Style links with color and hover underline
- [x] Style blockquotes with left border and italic text

### Autosave Implementation
- [x] Import `debounce` from lodash
- [x] Create debounced save function (3 second delay)
- [x] Pass to TiptapEditor onUpdate prop
- [x] Call update mutation when debounced function triggers
- [x] Show save status: "Saving...", "Saved", "Error"
- [x] Clear "Saved" status after 2 seconds

### Manual Save Button
- [x] Add "Save" button in toolbar
- [x] On click: Cancel debounced save, immediately call update mutation
- [ ] Show loading spinner on button during save
- [ ] Show success toast on save complete

---

## 8. Frontend - Metadata Fields

### Metadata Sidebar
- [ ] Create `src/components/MetadataSidebar.tsx`
- [ ] Display section title: "Metadata"
- [ ] Render all metadata fields from module.metadata array
- [ ] "Add Field" button at bottom
- [ ] Empty state: "No custom fields yet" when metadata is empty or null

### Add Field Modal
- [ ] Create `src/components/AddFieldModal.tsx`
- [ ] Form fields: Field Name (required), Field Type (dropdown: Text, Number, Date, Dropdown, Tags)
- [ ] For Dropdown type: Show additional input for comma-separated options
- [ ] Generate unique field ID: `crypto.randomUUID()` or timestamp
- [ ] On submit: Update metadata array, call update mutation
- [ ] Use optimistic updates for immediate UI feedback

### Field Type Components
- [ ] Create `src/components/metadata/TextField.tsx` - single-line input, max 200 chars
- [ ] Create `src/components/metadata/NumberField.tsx` - number input
- [ ] Create `src/components/metadata/DateField.tsx` - date picker (use shadcn/ui Calendar or native input)
- [ ] Create `src/components/metadata/DropdownField.tsx` - select with predefined options
- [ ] Create `src/components/metadata/TagsField.tsx` - pill input with add/remove (use shadcn/ui Badge)
- [ ] Each component: Display field name, value, edit icon, delete icon
- [ ] Edit icon opens inline edit or modal
- [ ] Delete icon shows confirmation, removes field from metadata array

### Metadata Display Component
- [ ] Create `src/components/MetadataField.tsx`
- [ ] Accept props: field, onEdit, onDelete
- [ ] Render appropriate field type component based on field.type
- [ ] Show "No value" placeholder if value is empty/null
- [ ] Style as key-value pairs with clear labels

### Metadata Updates
- [ ] Create helper functions to add/update/delete fields in metadata array
- [ ] On any change: Call update mutation with new metadata array
- [ ] Use optimistic updates for instant UI feedback
- [ ] Rollback on error

---

## 9. Frontend - Delete Module

### Delete Confirmation Modal
- [x] Create `src/components/DeleteModuleModal.tsx`
- [x] Display module title in warning message
- [x] Input field: "Type the module title to confirm"
- [x] Compare input with module.title (case-sensitive)
- [x] Disable "Delete" button until input matches
- [x] Destructive styling: Red delete button
- [x] On confirm: Call delete mutation
- [x] On success: Navigate to dashboard, show success toast

### Delete from Dashboard
- [x] Add delete mutation to ModuleCard
- [x] Delete icon opens DeleteModuleModal
- [x] On success: Invalidate 'modules' query to refresh list
- [ ] Optimistically remove card from UI

### Delete from Editor
- [x] Add delete button in editor page (gear icon menu or toolbar)
- [x] Opens DeleteModuleModal
- [x] On success: Navigate to dashboard

---

## 10. Frontend - Styling & UX Polish

### Dashboard Styling
- [x] Style module cards: white background, rounded corners, shadow
- [x] Grid layout: 3-4 columns on desktop, 2 on tablet, 1 on mobile
- [x] Card hover effect: lift (-translate-y-1), increase shadow
- [x] Search bar: w-full md:w-96, rounded, border, focus ring
- [x] Pagination: centered, spacing between buttons
- [x] Empty state: centered, max-w-md

### Editor Styling
- [x] Editor page: max-w-7xl mx-auto (centered with max width)
- [ ] Sidebar: w-80 (320px), border-r, overflow-y-auto, sticky
- [x] Main editor: flex-1, p-8
- [x] Title input: text-3xl font-bold, no border on non-hover
- [x] Description: text-gray-600, italic if empty
- [x] Save status: absolute top-right, small text with icon

### Responsive Design
- [ ] Mobile: Stack sidebar below editor, full-width
- [x] Tablet: 2-column grid for modules
- [ ] Desktop: Show sidebar and editor side-by-side
- [x] Ensure touch targets are large enough on mobile (min 44x44px)

### Loading States
- [x] Dashboard: Skeleton cards while loading (use shadcn/ui Skeleton)
- [x] Editor: Skeleton for title, description, editor while loading
- [x] Button loading states: Spinner + disabled state

### Error Handling
- [x] Dashboard: Show error message if modules fetch fails
- [x] Editor: Show error message if module fetch fails
- [ ] Toast notifications for mutation errors (create, update, delete)
- [x] Form validation errors displayed inline

---

## 11. Testing & Verification

### Manual Testing - CRUD Operations
- [ ] Test create module: Fill form, submit, verify redirect to editor
- [ ] Test list modules: Verify all user's modules displayed
- [ ] Test search: Search by title, verify filtering works
- [ ] Test pagination: Create 20+ modules, verify pagination works
- [ ] Test get single module: Click card, verify editor loads with correct data
- [ ] Test update title: Change title, blur, verify save
- [ ] Test update description: Change description, verify save
- [ ] Test update content: Type in editor, verify autosave after 3 seconds
- [ ] Test manual save: Click save button, verify immediate save
- [ ] Test delete module: Delete from card, verify removed from list
- [ ] Test delete from editor: Delete from editor, verify redirect to dashboard

### Manual Testing - Tiptap Editor
- [ ] Test headings: Apply H1, H2, H3, verify formatting
- [ ] Test bold: Select text, click bold, verify bold applied
- [ ] Test italic: Select text, click italic, verify italic applied
- [ ] Test bullet list: Create bullet list, verify formatting
- [ ] Test ordered list: Create numbered list, verify formatting
- [ ] Test link: Insert link, verify clickable and opens in new tab
- [ ] Test blockquote: Apply blockquote, verify styling
- [ ] Test horizontal rule: Insert HR, verify rendered
- [ ] Test active states: Verify toolbar buttons highlight when active
- [ ] Test content persistence: Type content, refresh page, verify content persisted

### Manual Testing - Metadata Fields
- [ ] Test add text field: Add field, enter value, verify saved
- [ ] Test add number field: Add field, enter number, verify saved
- [ ] Test add date field: Add field, select date, verify saved
- [ ] Test add dropdown field: Add field with options, select value, verify saved
- [ ] Test add tags field: Add field, add multiple tags, verify saved
- [ ] Test edit field value: Edit existing field, verify updated
- [ ] Test delete field: Delete field with confirmation, verify removed
- [ ] Test empty metadata: Verify "No custom fields" message shows

### Edge Cases
- [ ] Test empty editor content: Save with no content, verify empty string saved
- [ ] Test XSS prevention: Insert `<script>alert('xss')</script>` in editor, verify sanitized on backend
- [ ] Test long title: Enter 100+ char title, verify validation error
- [ ] Test long description: Enter 500+ char description, verify error
- [ ] Test unauthorized access: Try accessing another user's module (manually change URL), verify 403
- [ ] Test concurrent edits: Open same module in two tabs, edit in both, verify last save wins

### Authorization Testing
- [ ] Test module ownership: Verify only owner can view/edit/delete their modules
- [ ] Test protected routes: Verify unauthenticated users can't access editor or dashboard
- [ ] Test 403 errors: Verify proper error messages for unauthorized access

---

## Implementation Order Recommendation

**Phase 1: Backend Module API (Days 1-2)**
1. Database Schema - Module Table
2. Backend - Module CRUD Routes
3. Test all endpoints with Postman

**Phase 2: Frontend Dashboard (Days 3-4)**
4. React Query Setup
5. Dashboard Page (list, search, pagination)
6. Create Module Flow

**Phase 3: Tiptap Editor (Days 5-7)**
7. Module Editor Page Layout
8. Tiptap Editor Integration (editor, toolbar, autosave)
9. Link handling

**Phase 4: Metadata Fields (Days 8-9)**
10. Metadata Sidebar
11. Add/Edit/Delete Field Components
12. All five field types

**Phase 5: Delete & Polish (Days 10-11)**
13. Delete Module Flow
14. Styling & UX Polish
15. Loading and error states

**Phase 6: Testing (Day 12)**
16. Manual testing all features
17. Edge case testing
18. Bug fixes

**Estimated Total**: 12-14 days for complete module CRUD system
