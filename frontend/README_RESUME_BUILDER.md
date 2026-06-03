# Resume Intelligence Core (RAG Core) - Component Documentation

## Overview

The Resume Intelligence Core is a modern, professional resume/CV creation platform built with Next.js, TypeScript, and React. It provides users with a seamless way to create, edit, preview, and export resumes with real-time updates and professional templates.

## Architecture Overview

### Directory Structure

```
frontend/
├── app/(app)/cv/
│   ├── page.tsx                 # Root CV page (redirects to upload)
│   ├── upload/
│   │   └── page.tsx             # Resume Uploader page
│   └── builder/
│       └── page.tsx             # Resume Builder main page
├── components/resume-builder/
│   ├── personal-info-form.tsx   # Personal information form
│   ├── experience-form.tsx      # Work experience form
│   ├── education-form.tsx       # Education entries form
│   ├── skills-form.tsx          # Skills tag input
│   ├── projects-form.tsx        # Projects form
│   ├── certifications-form.tsx  # Certifications form
│   ├── resume-preview.tsx       # Real-time resume preview
│   ├── template-selector.tsx    # Template selection UI
│   ├── export-options.tsx       # PDF/JSON export
│   └── resume-management.tsx    # Resume list management
├── lib/resume/
│   ├── types.ts                 # Zod schemas & TypeScript types
│   └── utils.ts                 # Utility functions & HTML generation
└── store/
    └── resume.ts                # Zustand resume state management
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Resume Builder Page                        │
│            (app/(app)/cv/builder/page.tsx)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
        ┌───────▼────────┐   ┌───────▼────────┐
        │  Form Editor   │   │  Real-time     │
        │  (Left Side)   │◄─►│  Preview       │
        │                │   │  (Right Side)  │
        └────┬──────┬────┘   └────────────────┘
             │      │
      ┌──────▼──────▼──────┐
      │  Zustand Store     │
      │  (useResumeStore)  │
      └──────┬─────────────┘
             │
      ┌──────▼─────────────┐
      │ LocalStorage       │
      │ (JSON persistence) │
      └────────────────────┘
```

## Key Components

### 1. **Resume Builder Page** (`builder/page.tsx`)
**Purpose:** Main component orchestrating the entire resume building experience.

**Features:**
- Split-screen layout (form + preview)
- Tab-based section navigation
- Resume title management
- Save/new/manage buttons
- Integration of all form sections

**Key State:**
- `currentResume`: The resume being edited
- `savedResumes`: List of all saved resumes
- `selectedTemplate`: Currently selected template
- `isSaving`: Loading state for save operation

**User Flow:**
1. User lands on builder page
2. Can create new resume or load existing one
3. Fill out form sections (tabs on left)
4. Preview updates in real-time (right side)
5. Save resume to localStorage
6. Export as PDF or JSON

---

### 2. **Form Components**

#### **PersonalInfoForm** (`personal-info-form.tsx`)
**Purpose:** Handles basic personal information and contact details.

**Fields:**
- Full Name (required)
- Email (required)
- Phone (required)
- Address (optional)
- LinkedIn URL (optional)
- GitHub URL (optional)
- Portfolio Website (optional)
- Professional Summary (optional, max 500 chars)

**Validation:** Uses `personalInfoSchema` from Zod
- Email: Valid email format
- URLs: Valid URL format
- Name: 1-100 characters
- Phone: Minimum 10 digits

**Location on Page:** Tab 1 - "Personal"

---

#### **ExperienceForm** (`experience-form.tsx`)
**Purpose:** Manages work experience entries with add/edit/delete capabilities.

**Features:**
- Add multiple experience entries
- Inline editing (click to edit)
- Delete functionality
- Date range selection

**Fields per Entry:**
- Company (required)
- Position (required)
- Start Date (required, month picker)
- End Date (required, month picker)
- Responsibilities (required, textarea)

**Validation:** Uses `experienceSchema` from Zod

**User Interaction:**
1. Click "+ Add Experience" button
2. Fill form in expanded mode
3. Click "Save" to confirm
4. Click entry to edit again
5. Click trash icon to delete

**Location on Page:** Tab 2 - "Experience"

---

#### **EducationForm** (`education-form.tsx`)
**Purpose:** Manages educational background with multiple entries.

**Features:**
- Add multiple education entries
- Inline editing
- Optional GPA field
- Optional description

**Fields per Entry:**
- Institution (required)
- Degree (required)
- Start Date (required, month picker)
- End Date (required, month picker)
- GPA (optional)
- Description (optional)

**Validation:** Uses `educationSchema` from Zod

**Similar UX to ExperienceForm:**
- Click to edit entries
- "+ Add Education" button for new entries
- Trash icon to delete

**Location on Page:** Tab 3 - "Education"

---

#### **SkillsForm** (`skills-form.tsx`)
**Purpose:** Dynamic tag-based skill input system.

**Features:**
- Text input with "Add" button
- Press Enter to add skill
- Visual tag display with remove option
- No duplicate prevention by default (can add same skill multiple times)

**User Flow:**
1. Type skill name (e.g., "Python")
2. Press Enter or click "Add"
3. Skill appears as a tag below
4. Click X on tag to remove

**Location on Page:** Tab 4 - "Skills"

---

#### **ProjectsForm** (`projects-form.tsx`)
**Purpose:** Manages project portfolio entries.

**Fields per Entry:**
- Project Name (required)
- Description (required)
- Technologies (dynamic tags, required array)
- Project Link (optional URL)

**Features:**
- Add/edit/delete projects
- Dynamic technology tag system
- Link to project demo or repository

**Validation:** Uses `projectSchema` from Zod

**Location on Page:** Tab 5 - "Projects"

---

#### **CertificationsForm** (`certifications-form.tsx`)
**Purpose:** Optional certifications section.

**Fields per Entry:**
- Certification Name (required)
- Issuer (required)
- Issue Date (required, month picker)
- Credential Link (optional URL)

**Features:**
- Add/edit/delete certifications
- All fields optional as section is optional

**Location on Page:** Tab 6 - "Certs"

---

### 3. **ResumePreview** (`resume-preview.tsx`)
**Purpose:** Real-time preview of resume as user edits.

**Features:**
- Updates instantly as form changes
- Shows all sections in order
- Professional formatting applied
- Responsive layout
- Empty state messaging

**Rendering Logic:**
1. Personal info (name, contact, links)
2. Professional summary (if present)
3. Experience section (if any entries)
4. Education section (if any entries)
5. Skills section (if any skills)
6. Projects section (if any projects)
7. Certifications section (if any certs)

**Styling:**
- Monochrome professional design
- Blue accent color (#2563eb)
- Proper spacing and typography
- Print-friendly CSS

---

### 4. **TemplateSelector** (`template-selector.tsx`)
**Purpose:** Allows users to choose resume template.

**Available Templates:**
1. **Modern** - Clean, contemporary design with accent colors
2. **Classic** - Traditional professional format
3. **Minimal** - Simplistic, distraction-free layout

**Features:**
- Visual selection cards
- Shows template name and description
- Highlights selected template
- Updates preview instantly

**Location:** Top of "Personal" tab

---

### 5. **ExportOptions** (`export-options.tsx`)
**Purpose:** Handles resume export functionality.

**Export Formats:**
1. **PDF** - Uses browser print functionality
   - Generates HTML and opens print dialog
   - A4 page size
   - Maintains template formatting
   - User can save as PDF from print dialog

2. **JSON** - Downloads resume data as JSON file
   - File naming: `{title}-{date}.json`
   - Useful for backups or version control

**Location:** Bottom of form panel

**User Flow:**
1. Click "Export as PDF" → Print dialog opens
2. Select printer as "Save as PDF"
3. Choose location and save
4. Or click "Export as JSON" to backup data

---

### 6. **ResumeManagement** (`resume-management.tsx`)
**Purpose:** Displays list of saved resumes with management options.

**Features:**
- List all saved resumes
- Show last updated date
- Duplicate resume
- Delete resume
- Click to load/edit

**Buttons per Resume:**
- Primary click area: Load/edit resume
- Copy icon: Duplicate resume
- Trash icon: Delete resume

**Empty State:** Shows helpful message when no resumes

---

### 7. **Zustand Store** (`store/resume.ts`)
**Purpose:** Global state management using Zustand.

**State Structure:**
```typescript
{
  currentResume: Resume,           // Resume being edited
  savedResumes: Resume[],          // All saved resumes
  selectedTemplate: string,        // Active template
}
```

**Key Actions:**
- `setCurrentResume()` - Load a resume
- `updateCurrentResume()` - Update current resume
- `addSavedResume()` - Save new resume
- `removeSavedResume()` - Delete resume
- `setSavedResumes()` - Replace entire list
- `setSelectedTemplate()` - Change template

**Persistence:**
- Automatically saved to localStorage
- Loaded on page mount
- Auto-saves on resume updates

---

### 8. **Types & Validation** (`lib/resume/types.ts`)
**Purpose:** Define all data structures using Zod.

**Main Types:**
```typescript
- PersonalInfo
- Education
- Experience
- Skill
- Project
- Certification
- Resume (main container)
```

**Validation Rules:**
- Email: Must be valid email
- URLs: Must be valid HTTPS URLs
- Names: 1-100 characters
- Dates: Month picker format
- Descriptions: Optional text
- Summary: Max 500 characters

**Default Resume Template:**
- Starts with empty personal info
- Empty arrays for collections
- Modern template selected by default

---

### 9. **Utilities** (`lib/resume/utils.ts`)
**Purpose:** Helper functions for resume operations.

**Key Functions:**
1. `generateResumeId()` - Creates unique ID
2. `formatDate()` - Formats dates for display
3. `calculateYearsExperience()` - Computes total experience
4. `generateResumeHTML()` - Creates HTML for PDF
5. `downloadJSON()` - Exports resume as JSON
6. `generateModernTemplate()` - Modern template HTML
7. `generateClassicTemplate()` - Classic template HTML
8. `generateMinimalTemplate()` - Minimal template HTML

---

## Component Relationships

```
ResumeBuilderPage (Main Container)
├── Header
│   ├── Resume Title Input
│   ├── New Button → handleNewResume()
│   ├── Manage Button → Shows ResumeManagement
│   └── Save Button → handleSaveResume()
│
├── ResumeManagement (when showManagement=true)
│   └── Displays list of saved resumes
│       ├── Shows current resume
│       ├── Duplicate option
│       └── Delete option
│
└── Main Content (when showManagement=false)
    ├── Form Editor (Left 50%)
    │   ├── Tabs Navigation
    │   │   ├── Personal
    │   │   │   ├── TemplateSelector
    │   │   │   └── PersonalInfoForm
    │   │   ├── Experience → ExperienceForm
    │   │   ├── Education → EducationForm
    │   │   ├── Skills → SkillsForm
    │   │   ├── Projects → ProjectsForm
    │   │   └── Certifications → CertificationsForm
    │   │
    │   └── Export Footer
    │       └── ExportOptions
    │
    └── Preview (Right 50%)
        └── ResumePreview (updates real-time)
```

## State Management Flow

```
User Input
    ↓
Form Component (e.g., PersonalInfoForm)
    ↓
handleSubmit/onChange
    ↓
updateCurrentResume()
    ↓
Zustand Store updates
    ↓
localStorage auto-updates
    ↓
Component re-renders
    ↓
Preview updates automatically
```

## User Workflows

### Creating a New Resume
1. Click "New" button in header
2. Form clears, new resume ID generated
3. Fill in personal info tab first
4. Select template
5. Navigate through other tabs to add content
6. Preview updates in real-time
7. Click "Save" to persist
8. Resume appears in "Manage" list

### Editing Existing Resume
1. Click "Manage" button
2. Click resume to load
3. Edit any section (auto-saves to store)
4. Click "Save" to persist to localStorage
5. Or switch to another resume

### Duplicating a Resume
1. Click "Manage" button
2. Click copy icon on any resume
3. New resume loaded (same content, new ID)
4. Title auto-appended with "(Copy)"
5. Edit and save as new resume

### Exporting Resume
1. Fill out resume content
2. Scroll to bottom of form
3. Click "Export as PDF" → Print dialog
4. Select "Save as PDF" printer
5. Choose location and save
6. Or click "Export as JSON" for data backup

## Styling Approach

- **Framework:** Tailwind CSS
- **Components:** Shadcn UI components
- **Responsive:** Mobile-first, single column on small screens
- **Split-screen:** Only on lg breakpoint and above
- **Colors:** Blue (#2563eb) as primary accent
- **Typography:** System fonts with proper hierarchy
- **Spacing:** Consistent 4px grid system

## Accessibility Features

- Proper semantic HTML
- Form labels associated with inputs
- Error messages linked to fields
- Keyboard navigation support
- Focus states on interactive elements
- ARIA attributes where needed
- Sufficient color contrast ratios

## Performance Considerations

- Components only re-render when relevant state changes
- useResumeStore prevents prop drilling
- localStorage caching reduces API calls
- Memoization on preview generation
- Lazy loading of form sections via tabs

## Backend Integration Points

Currently, the frontend works standalone with localStorage. When backend is ready:

1. **Save Resume**
   - POST `/api/resume` → Send resume object
   - Update store with server response
   - Handle error states

2. **Load Resumes**
   - GET `/api/resumes` → Fetch user's resumes
   - Populate savedResumes store

3. **Update Resume**
   - PATCH `/api/resume/{id}` → Update specific resume
   - Sync with store

4. **Delete Resume**
   - DELETE `/api/resume/{id}` → Remove resume
   - Update store

5. **Export/Share**
   - Generate shareable link
   - Add to resume metadata

---

## Future Enhancements

1. **Rich Text Editor** - WYSIWYG editing for descriptions
2. **Template Customization** - User can adjust colors, fonts
3. **Import from LinkedIn** - Auto-populate from LinkedIn profile
4. **Collaboration** - Share and get feedback
5. **Analytics** - Track resume views and clicks
6. **ATS Optimization** - Check ATS compliance
7. **Multiple Tailored Versions** - Create job-specific resumes
8. **Templates Gallery** - More design options
9. **Drag-and-drop Sections** - Reorder sections visually
10. **AI Suggestions** - Auto-improve descriptions

---

## Troubleshooting

**Preview not updating?**
- Check browser console for errors
- Verify Zustand store is properly initialized
- Ensure form is using updateCurrentResume()

**Resume not saving?**
- Check localStorage quota
- Verify no errors in console
- Try exporting as JSON to backup

**PDF export issues?**
- Ensure browser allows print dialogs
- Check for browser security restrictions
- Try in incognito mode

---

## Code Example: Adding a New Form Section

```typescript
// 1. Add to types.ts
export const sectionSchema = z.object({
  id: z.string(),
  field1: z.string().min(1),
  field2: z.string().optional(),
});

export type Section = z.infer<typeof sectionSchema>;

// 2. Add to Resume type
export const resumeSchema = z.object({
  // ... existing fields
  sections: z.array(sectionSchema),
});

// 3. Create component
export function SectionForm({ sections, onUpdate }: Props) {
  // Similar pattern to ExperienceForm
}

// 4. Add to builder page
<TabsTrigger value="section">Sections</TabsTrigger>
<TabsContent value="section">
  <SectionForm
    sections={currentResume.sections}
    onUpdate={(data) => updateCurrentResume({ sections: data })}
  />
</TabsContent>

// 5. Add to preview
{resume.sections.length > 0 && (
  <section>
    <h2>Sections</h2>
    {/* Render sections */}
  </section>
)}
```

---

## Summary

The Resume Intelligence Core provides a modern, user-friendly interface for creating professional resumes. With its component-based architecture, real-time preview, and flexible form system, users can easily build, customize, and export resumes in multiple formats. The modular design makes it easy to add new sections, templates, or features without affecting existing functionality.
