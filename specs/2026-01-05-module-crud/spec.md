# Specification: Module CRUD + Rich Editor

## Goal
Enable authenticated users to create, read, update, and delete modules with rich text content using Tiptap editor, supporting structured metadata fields, and providing a seamless editing experience for worldbuilding content.

## User Stories
- As a creator, I want to create a new module with a title and rich content so that I can document my characters, locations, or concepts
- As a creator, I want to edit my module's content using rich formatting (headings, bold, italic, lists, links) so that my documentation is well-structured and readable
- As a creator, I want to add custom metadata fields to my modules so that I can track specific attributes like "Age", "Location", or "Faction"
- As a creator, I want to delete modules I no longer need so that my workspace stays organized

## Specific Requirements

### Module Creation

**Create Module Flow**
- User clicks "Create Module" button from dashboard
- Modal or new page opens with form: Title (required), Description (optional textarea)
- On submit: POST to `/api/modules` with `{ title, description }` and auth token
- Backend creates module with owner set to current user, status "draft", empty content
- Return module ID and redirect to module editor page
- Initial content field empty (user fills in editor)

**Validation**
- Title: Required, 1-100 characters, trimmed
- Description: Optional, max 500 characters
- Module created with default visibility: "private"

### Module Editor (Rich Text)

**Tiptap Editor Setup**
- Use `@tiptap/react` with `@tiptap/starter-kit` for MVP extensions
- Extensions included: Document, Paragraph, Text, Heading (levels 1-3), Bold, Italic, BulletList, OrderedList, ListItem, Link, Blockquote, HardBreak, HorizontalRule
- Editor initialized with `useEditor()` hook, content loaded from module's `content` field (stored as HTML)
- Autosave: Save content to backend every 3 seconds when changes detected (debounced)

**Toolbar Components**
- Heading selector dropdown: Paragraph, H1, H2, H3
- Format buttons: Bold, Italic
- List buttons: Bullet List, Ordered List
- Insert buttons: Link (prompt for URL), Horizontal Rule
- Blockquote button
- Clear formatting button (remove all marks)
- Active state highlighting: Buttons show active state when cursor is in formatted text

**Link Handling**
- Link button prompts user for URL via modal or inline input
- Use `editor.chain().focus().setLink({ href: url })` to insert link
- Click on existing link shows tooltip with "Edit" and "Remove" actions
- Links open in new tab (`target="_blank"` with `rel="noopener noreferrer"`)

**Editor Styling**
- Use Tailwind CSS v4 for editor container styling
- Prose plugin or custom styles for typography (headings, paragraphs, lists)
- Editor min-height: 400px, max-height: none (grows with content)
- Focus state: Border highlight (Tailwind ring utilities)

**Content Storage**
- Content stored as HTML string in database (`content` field, TEXT type)
- Sanitize HTML on backend before saving (use library like `sanitize-html` to prevent XSS)
- On load: Fetch module, set editor content with `editor.commands.setContent(module.content)`

### Structured Metadata Fields

**Add Custom Fields**
- Module editor includes "Metadata" section below title/description
- User clicks "+ Add Field" to create new custom field
- Field creation modal: Field Name (required), Field Type (dropdown: Text, Number, Date, Dropdown, Tags)
- Each field stored as JSON object: `{ id, name, type, value }`
- Module schema includes `metadata` column (JSONB in PostgreSQL) to store array of field objects

**Field Types**
- **Text**: Single-line input, max 200 characters
- **Number**: Numeric input (integer or decimal)
- **Date**: Date picker, stored as ISO string
- **Dropdown**: Predefined options (e.g., "Faction: Alliance, Horde, Neutral")
- **Tags**: Multi-select pill input (comma-separated values stored as array)

**Edit/Delete Fields**
- Each field has inline edit icon and delete icon
- Edit: Open modal to change field name or value (type cannot be changed after creation)
- Delete: Remove field from metadata array with confirmation
- Changes saved to backend immediately (optimistic updates on frontend)

**Display Metadata**
- Metadata displayed in sidebar or section above editor
- Styled as key-value pairs with clear labels
- Empty fields show placeholder text: "No value"

### Module List/Dashboard

**Display All Modules**
- Protected route: `/dashboard` shows all modules owned by current user
- Display as grid or list view (toggle button for user preference)
- Each module card shows: Title, Description (truncated to 100 chars), Last Modified date, Thumbnail (if cover image exists, defer to future)
- Default sort: Last modified (newest first)
- Pagination: Show 20 modules per page (use offset-based pagination)

**Module Card Actions**
- Click card to open module editor
- Hover shows action buttons: Edit (pencil icon), Delete (trash icon)
- Delete button shows confirmation modal: "Are you sure? This action cannot be undone."
- On delete: Call `DELETE /api/modules/:id`, remove from UI optimistically

**Search Modules**
- Search bar at top of dashboard
- Search by title and description (case-insensitive, partial match)
- Use query parameter: `GET /api/modules?search=query`
- Debounced input (300ms delay before API call)

**Empty State**
- If no modules exist: Show illustration + "Create your first module" CTA button
- After search with no results: "No modules found" message with clear search button

### Module Update

**Save Changes**
- Autosave for editor content every 3 seconds (debounced)
- Manual save button in toolbar: "Save" (shows saved indicator after successful save)
- API: `PATCH /api/modules/:id` with `{ title, description, content, metadata }`
- Optimistic UI updates: Update local state immediately, rollback on error
- Display save status indicator: "Saving...", "Saved", "Error saving"

**Edit Title/Description**
- Title editable inline (contenteditable div or input field at top of editor page)
- Description editable in expandable textarea below title
- Changes saved on blur event or Ctrl+S keyboard shortcut

### Module Deletion

**Soft Delete (Recommended)**
- Instead of hard delete, set `deletedAt` timestamp field
- Deleted modules hidden from dashboard but recoverable (future feature: trash bin)
- API: `DELETE /api/modules/:id` sets `deletedAt = NOW()`
- For MVP: Hard delete is acceptable if soft delete adds complexity

**Confirmation Flow**
- Delete button in module card or editor page
- Modal: "Delete [Module Title]?" with warning text
- User must type module title to confirm (prevents accidental deletion)
- On confirm: API call, redirect to dashboard, show success toast

### Access Control

**Owner-Only Access**
- Only module owner can view, edit, or delete their modules
- Backend middleware checks: `userId` from JWT matches `module.ownerId`
- Return 403 Forbidden if user tries to access another user's module
- For MVP: No collaboration yet (defer to v1.0)

## Database Schema

**`modules` Table (Prisma Schema)**
```prisma
model Module {
  id          String    @id @default(cuid())
  title       String
  description String?
  content     String    @db.Text  // HTML content from Tiptap
  metadata    Json?     // Custom fields as JSONB
  visibility  String    @default("private")  // private, shared, public (for future)
  ownerId     String
  owner       User      @relation("OwnedModules", fields: [ownerId], references: [id], onDelete: Cascade)
  deletedAt   DateTime? // For soft delete (optional)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Future relations
  collaborators ModuleCollaborator[]
}
```

**Metadata JSON Structure Example**
```json
[
  { "id": "field1", "name": "Age", "type": "number", "value": 25 },
  { "id": "field2", "name": "Faction", "type": "dropdown", "value": "Alliance", "options": ["Alliance", "Horde", "Neutral"] },
  { "id": "field3", "name": "Tags", "type": "tags", "value": ["Warrior", "Hero", "NPC"] }
]
```

## API Endpoints

**Module CRUD**
- `POST /api/modules` - Create new module (protected)
  - Body: `{ title, description? }`
  - Returns: `{ id, title, description, content, metadata, ownerId, createdAt, updatedAt }`

- `GET /api/modules` - List all user's modules (protected)
  - Query params: `?search=query&page=1&limit=20`
  - Returns: `{ modules: [...], total, page, totalPages }`

- `GET /api/modules/:id` - Get single module (protected)
  - Returns: Full module object with content and metadata

- `PATCH /api/modules/:id` - Update module (protected)
  - Body: `{ title?, description?, content?, metadata? }`
  - Returns: Updated module object

- `DELETE /api/modules/:id` - Delete module (protected)
  - Returns: `{ success: true }`

## Frontend Components

**Dashboard Page (`/dashboard`)**
- Header: "My Modules" + search bar + "Create Module" button
- Grid/list view toggle
- Module cards with title, description, last modified
- Pagination controls at bottom
- Empty state with CTA

**Module Editor Page (`/modules/:id`)**
- Layout: Sidebar (metadata fields) + Main editor area
- Top bar: Title (editable inline), back button, save status indicator
- Description field (expandable textarea)
- Tiptap editor with toolbar
- Metadata section: Display all custom fields + "Add Field" button
- Auto-save every 3 seconds, manual save button in toolbar

**Create Module Modal/Page**
- Simple form: Title (required), Description (optional)
- Submit button: "Create Module"
- On success: Redirect to editor page for new module

**Delete Confirmation Modal**
- Triggered from module card or editor page
- Shows module title, warning text
- Input field: "Type module title to confirm"
- Buttons: "Cancel", "Delete" (red, destructive)

**Metadata Field Components**
- **TextFieldInput**: Single-line input
- **NumberFieldInput**: Number input with +/- controls
- **DateFieldInput**: Date picker component (use library or native input)
- **DropdownFieldInput**: Select dropdown with options
- **TagsFieldInput**: Pill input with add/remove tags

**Editor Toolbar Component**
- Sticky toolbar at top of editor when scrolling
- Button group: Headings dropdown, Bold, Italic
- Button group: Lists (bullet, ordered)
- Button group: Link, Blockquote, Horizontal Rule
- Save button + status indicator

## Visual Design

**Dashboard Layout**
- Clean, modern grid with card shadows (Tailwind shadow utilities)
- Hover effects: Lift card on hover (translate-y, shadow increase)
- Color scheme: Neutral backgrounds, primary accent for CTAs
- Module cards: White background, rounded corners, padding

**Editor Layout**
- Full-screen or max-width centered (1200px)
- Sidebar for metadata (300px wide, sticky)
- Main editor area: Clean white background, ample padding
- Toolbar: Sticky at top, subtle border/shadow

**Tiptap Styling**
- Use Tailwind typography plugin or custom prose styles
- Headings: Bold, larger font sizes (H1: 2xl, H2: xl, H3: lg)
- Lists: Proper indentation, bullet/number styling
- Links: Underline on hover, primary color
- Blockquotes: Left border, italic text, gray background

**Responsive Design**
- Mobile: Stack sidebar below editor, full-width cards
- Tablet: 2-column grid for module cards
- Desktop: 3-4 column grid, sidebar + editor side-by-side

## Tiptap Integration Details

**Installation**
- Packages: `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`
- Optional: `@tiptap/extension-link` (if not in StarterKit), `@tiptap/extension-placeholder`

**Editor Initialization**
```typescript
const editor = useEditor({
  extensions: [StarterKit, Link, Placeholder.configure({ placeholder: 'Start writing...' })],
  content: module.content || '',
  onUpdate: ({ editor }) => {
    debouncedSave(editor.getHTML())
  }
})
```

**Toolbar Implementation**
- Use `editor.chain().focus()` for all commands to maintain focus
- Check active state: `editor.isActive('bold')` for button highlighting
- Link insertion: Prompt or modal for URL, then `editor.chain().focus().setLink({ href: url }).run()`

**Content Sanitization (Backend)**
- Use `sanitize-html` library to allow safe HTML tags (p, h1-h3, strong, em, ul, ol, li, a, blockquote, br, hr)
- Strip dangerous tags (script, iframe, object) and attributes (onclick, onerror)

## Existing Code to Leverage

**From Authentication Spec**
- Auth middleware pattern for protecting module routes
- JWT token extraction from `Authorization` header
- User context from `req.user` for owner checks

**React Patterns**
- React Hook Form + Zod for create module form validation
- Optimistic updates pattern from auth (can reuse for module updates)
- Toast notifications for success/error messages

**TanStack Query (React Query)**
- Query hooks for fetching modules: `useQuery(['modules'], fetchModules)`
- Mutation hooks for create/update/delete: `useMutation(createModule)`
- Automatic cache invalidation after mutations

## Out of Scope

- Module collaboration/sharing (defer to v1.0)
- Module templates (defer to v1.5)
- Cover images/thumbnails (defer to v1.0)
- Image upload within editor (defer to v1.0)
- Comments on modules (defer to v2.0)
- Version history/rollback (defer to v1.0)
- Public module gallery (defer to v1.5)
- Module linking/relationships (defer to v1.0)
- Collections/workspaces for organizing modules (defer to v1.0)
- Export module as PDF/Markdown (defer to v1.5)
- Rich media embeds (YouTube, etc.) in editor (defer to v2.0)
- Table support in editor (defer to v1.0)
- Code blocks in editor (defer to v1.0)
- Advanced metadata field types (file upload, rich text, etc.) (defer to v2.0)
- Keyboard shortcuts beyond basic formatting (defer to v1.0)
- Drag-and-drop ordering of metadata fields (defer to v1.5)
