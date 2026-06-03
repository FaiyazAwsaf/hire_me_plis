# Resume Builder - Quick Start Guide

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Basic React/TypeScript knowledge

### Installation

1. **Install dependencies** (if not already done)
```bash
cd frontend
npm install
```

2. **Ensure required packages are installed:**
```bash
npm install zod react-hook-form @hookform/resolvers zustand lucide-react
```

3. **Run the development server:**
```bash
npm run dev
```

4. **Open browser:**
Navigate to `http://localhost:3000/cv/builder`

---

## Project Structure Reference

```
frontend/
├── app/(app)/cv/
│   ├── page.tsx                    # Redirects to /upload
│   ├── upload/page.tsx             # Resume Uploader entry point
│   └── builder/page.tsx            # Resume Builder main page
│
├── components/resume-builder/
│   ├── index.ts                    # Component exports
│   ├── personal-info-form.tsx
│   ├── experience-form.tsx
│   ├── education-form.tsx
│   ├── skills-form.tsx
│   ├── projects-form.tsx
│   ├── certifications-form.tsx
│   ├── resume-preview.tsx
│   ├── template-selector.tsx
│   ├── export-options.tsx
│   └── resume-management.tsx
│
├── lib/resume/
│   ├── types.ts                    # Zod schemas & TypeScript types
│   └── utils.ts                    # Helper functions
│
├── store/
│   └── resume.ts                   # Zustand resume store
│
└── README_RESUME_BUILDER.md        # Detailed documentation
```

---

## Key Features to Test

### 1. Form Editing
- [ ] Fill personal information
- [ ] Add experience entry
- [ ] Add education entry
- [ ] Add skills (press Enter)
- [ ] Add project with technologies
- [ ] Add certification

### 2. Real-time Preview
- [ ] Edit form field → preview updates instantly
- [ ] Switch templates → preview changes style
- [ ] Add/remove sections → preview reflects changes

### 3. Template Selection
- [ ] Select "Modern" template
- [ ] Select "Classic" template
- [ ] Select "Minimal" template
- [ ] Verify preview updates

### 4. Resume Management
- [ ] Click "New" button → creates fresh resume
- [ ] Click "Save" button → saves to localStorage
- [ ] Click "Manage" button → shows saved resumes
- [ ] Click resume in list → loads resume
- [ ] Click copy icon → duplicates resume
- [ ] Click trash icon → deletes resume

### 5. Export Functionality
- [ ] Click "Export as PDF" → opens print dialog
- [ ] Save as PDF from print dialog
- [ ] Click "Export as JSON" → downloads JSON file
- [ ] Verify JSON contains all data

### 6. Form Validation
- [ ] Try saving without required fields → shows errors
- [ ] Enter invalid email → shows error
- [ ] Enter invalid URL → shows error
- [ ] All validations pass with correct data

---

## Component API Reference

### PersonalInfoForm
```typescript
<PersonalInfoForm
  data={personalInfo}
  onSave={(data) => updateCurrentResume({ personalInfo: data })}
/>
```

### ExperienceForm
```typescript
<ExperienceForm
  experiences={experience}
  onUpdate={(data) => updateCurrentResume({ experience: data })}
/>
```

### SkillsForm
```typescript
<SkillsForm
  skills={skills}
  onUpdate={(data) => updateCurrentResume({ skills: data })}
/>
```

(Similar pattern for all other form components)

### ResumePreview
```typescript
<ResumePreview resume={currentResume} />
```

### ExportOptions
```typescript
<ExportOptions resume={currentResume} />
```

---

## State Management

### Using Zustand Store

```typescript
import { useResumeStore } from "@/store/resume";

export function MyComponent() {
  const {
    currentResume,
    updateCurrentResume,
    savedResumes,
  } = useResumeStore();

  return (
    <div>
      <p>{currentResume.personalInfo.fullName}</p>
    </div>
  );
}
```

### Available Store Actions

```typescript
const {
  currentResume,           // Current resume object
  setCurrentResume,        // Load a resume
  updateCurrentResume,     // Update current resume
  savedResumes,            // Array of saved resumes
  setSavedResumes,         // Replace entire list
  addSavedResume,          // Add new resume
  removeSavedResume,       // Delete resume by ID
  updateSavedResume,       // Update saved resume by ID
  selectedTemplate,        // Current template
  setSelectedTemplate,     // Change template
  reset,                   // Reset to default state
} = useResumeStore();
```

---

## Common Tasks

### Add a New Form Section

1. **Create schema in `lib/resume/types.ts`:**
```typescript
export const newSectionSchema = z.object({
  id: z.string(),
  field1: z.string().min(1),
  field2: z.string().optional(),
});
```

2. **Create component `components/resume-builder/new-section-form.tsx`:**
```typescript
export function NewSectionForm({ items, onUpdate }: Props) {
  // Follow pattern from ExperienceForm
}
```

3. **Add to Resume schema:**
```typescript
export const resumeSchema = z.object({
  // ... existing fields
  newSection: z.array(newSectionSchema),
});
```

4. **Add to builder page:**
```typescript
<TabsTrigger value="newsection">New Section</TabsTrigger>
<TabsContent value="newsection">
  <NewSectionForm
    items={currentResume.newSection}
    onUpdate={(data) => updateCurrentResume({ newSection: data })}
  />
</TabsContent>
```

5. **Add to preview:**
```typescript
{resume.newSection.length > 0 && (
  <section className="mb-5">
    <h2>New Section</h2>
    {/* Render items */}
  </section>
)}
```

### Modify Form Validation

Edit `lib/resume/types.ts` and update the corresponding schema:

```typescript
export const personalInfoSchema = z.object({
  // Add stricter validation
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format"),
});
```

### Change Template Styling

Edit `lib/resume/utils.ts` and update the template HTML generation:

```typescript
function generateModernTemplate(resume: Resume): string {
  return `
    <style>
      /* Update CSS here */
    </style>
    <!-- HTML template -->
  `;
}
```

---

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Performance Tips

1. **Large resume data** - Split into multiple sessions
2. **Many saved resumes** - Archive old resumes to JSON
3. **Real-time preview** - Preview updates are optimized with React.useMemo

---

## Troubleshooting

### Issue: Form doesn't update preview
**Solution:** Check that `onSave`/`onUpdate` calls `updateCurrentResume()`

### Issue: localStorage quota exceeded
**Solution:** Export old resumes as JSON and delete from app

### Issue: PDF export doesn't work
**Solution:** Check browser print settings, try incognito mode

### Issue: Validation errors not showing
**Solution:** Ensure form uses `react-hook-form` with `zodResolver`

---

## Environment Variables

No additional environment variables needed for Resume Builder. It works with:
- `NEXT_PUBLIC_API_URL` (when backend is connected)

---

## Testing Checklist

Before deploying to production:

- [ ] All form sections submit correctly
- [ ] Validation messages display
- [ ] Real-time preview updates
- [ ] Save/load resumes from localStorage
- [ ] PDF export works
- [ ] JSON export works
- [ ] Responsive design on mobile
- [ ] All templates render correctly
- [ ] Keyboard navigation works
- [ ] Screen reader friendly (basic test)

---

## Next Steps

### For Backend Integration
1. Create API endpoints for CRUD operations
2. Update store to call API instead of localStorage
3. Add loading/error states
4. Implement user authentication

### For UI Enhancement
1. Add rich text editor for descriptions
2. Add image upload for profile picture
3. Add color/font customization
4. Add section reordering (drag-drop)

### For Features
1. Add ATS score checker
2. Add AI suggestions
3. Add resume templates library
4. Add resume sharing/links

---

## Resources

- [Zod Documentation](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Next.js Documentation](https://nextjs.org/docs)

---

## Support

For issues or questions:
1. Check the main README_RESUME_BUILDER.md
2. Review component source code
3. Check browser console for errors
4. Look at example usage in builder/page.tsx

---

Last Updated: June 2025
