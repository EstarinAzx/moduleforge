# Product Roadmap

## MVP (Minimum Viable Product)
*Goal: Core functionality for single-user worldbuilding with basic collaboration*

### Authentication & User Management
- [x] User registration and login (email/password) - **M**
- [x] User profile and settings - **S**
- [x] Password reset flow - **S**

### Core Module System
- [x] Create module with title and description - **M**
- [x] Edit module content (rich text editor) - **L**
  - Supports: headings, bold, italic, lists, links
- [x] Delete module (with confirmation) - **S**
- [x] Module visibility: private by default - **XS**

### Structured Metadata
- [ ] Add custom fields to modules - **L**
  - Field types: text, number, date, dropdown, tags
- [ ] Display metadata in structured section - **M**
- [ ] Edit metadata inline - **M**

### Media Support
- [ ] Upload images to modules - **M**
- [ ] Image gallery view within modules - **M**
- [ ] Embed external media (YouTube, etc.) - **S**

### Dashboard & Organization
- [x] User dashboard showing all owned modules - **M**
- [x] Search modules by title/content - **M**
- [x] Basic module list (grid/list view) - **S**

**Estimated Total**: ~8-10 weeks for MVP

---

## Version 1.0: Enhanced Collaboration
*Goal: Full collaboration features and better organization*

### Invitation-Based Collaboration
- [ ] Invite users to collaborate on a module (via email/username) - **L**
- [ ] Accept/decline invitations - **M**
- [ ] Collaborator permissions: view vs edit - **M**
- [ ] Remove collaborators - **S**
- [ ] Activity log: who edited what and when - **L**
  - **Depends on**: Core Module System

### Module Interconnection
- [ ] Link modules to each other (@mention or link picker) - **L**
- [ ] Display linked modules in sidebar/footer - **M**
- [ ] Relationship types (e.g., "child of", "located in") - **L**
- [ ] Visual relationship graph (simple network view) - **XL**
  - **Depends on**: Module linking

### Collections & Workspaces
- [ ] Create collections to group modules - **M**
- [ ] Assign modules to collections - **S**
- [ ] Workspace concept: separate "universes" for different projects - **L**
- [ ] Switch between workspaces - **M**
  - **Depends on**: Collections

### Enhanced Editor
- [ ] Advanced rich text: tables, code blocks, callouts - **M**
- [ ] Markdown support (optional toggle) - **S**
- [ ] Auto-save drafts - **M**
- [ ] Version history and rollback - **XL**

**Estimated Total**: ~6-8 weeks

---

## Version 1.5: Power User Features
*Goal: Advanced organization, templates, and export*

### Templates
- [ ] Create module templates - **L**
- [ ] Pre-populate new modules from templates - **M**
- [ ] Template library (community or personal) - **L**
  - **Depends on**: Structured metadata

### Advanced Search & Filters
- [ ] Filter by tags, custom fields, date created - **M**
- [ ] Full-text search across all modules - **L**
- [ ] Saved searches/smart collections - **M**

### Export & Backup
- [ ] Export single module as PDF/Markdown - **M**
- [ ] Bulk export entire workspace - **L**
- [ ] Automated backups - **M**

### Public Sharing (Optional)
- [ ] Generate shareable link for read-only access - **M**
- [ ] Public module gallery (opt-in) - **L**
- [ ] Embed modules on external sites - **L**

**Estimated Total**: ~4-6 weeks

---

## Version 2.0: Visual & Mobile
*Goal: Rich visual experience and mobile access*

### Visual Enhancements
- [ ] Module cover images - **S**
- [ ] Customizable themes (dark mode, color schemes) - **M**
- [ ] Drag-and-drop image placement - **M**
- [ ] Interactive maps (pin modules to locations on uploaded maps) - **XL**

### Mobile Experience
- [ ] Responsive design for mobile browsers - **L**
- [ ] Mobile-optimized editor - **M**
- [ ] Progressive Web App (PWA) for offline access - **L**

### AI-Assisted Features (Future)
- [ ] AI-generated summaries for modules - **M**
- [ ] Auto-suggest tags/categories - **M**
- [ ] Relationship discovery suggestions - **L**

**Estimated Total**: ~6-8 weeks

---

## Effort Estimates Key
- **XS**: < 1 day
- **S**: 1-2 days
- **M**: 3-5 days
- **L**: 1-2 weeks
- **XL**: 2-4 weeks

## Prioritization Principles
1. **MVP first**: Get core creation, editing, and basic collaboration working
2. **User control**: Prioritize features that give users control (permissions, privacy)
3. **Interconnection**: Module linking is core to the value proposition
4. **Polish later**: Advanced features (AI, mobile, public sharing) come after core UX is solid
