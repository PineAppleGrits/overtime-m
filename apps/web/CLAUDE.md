# Development Standards & Project Guidelines

## 1. Context & Governance
- **Strict Adherence:** Before generating or refactoring code, strictly consult and apply the conventions defined within the `.claude/skills` directory.
- **Monorepo Architecture:** Maintain a clean separation between the Frontend (Next.js) and Backend (Nest.js) packages.

---

## 2. Frontend Standards (Next.js)

### Design & Responsiveness
- **Mobile-First Approach:** Always implement a mobile-first strategy using Tailwind CSS utilities or CSS Media Queries.
- **Fluid Layouts:** Every component or page must be 100% responsive. Use **Flexbox** and **CSS Grid** for structural adaptability.
- **Relative Units:** Prioritize `rem`, `em`, `vh/vw`, and percentages over fixed `px` values to ensure scalability across devices.

### Form Management & Validation
- **React Hook Form:** Mandatory for all form state management to ensure optimal performance and re-rendering control.
- **Zod Schemas:** All schema validations must be defined with **Zod**. The schema is the **single source of truth** for both validation and input types.
- **Integration:** Use `@hookform/resolvers/zod` to bridge React Hook Form and Zod.

### Data Mutations (Server Actions)
- **No API Routes:** Do not create internal mutation routes in `/api`. Use **Next.js Server Actions** exclusively.
- **Organization:** Actions must be defined in `actions.ts` files within their respective feature modules.
- **Type Safety:** Actions must perform server-side validation of `formData` or payloads using the corresponding Zod schema before executing business logic.

---

## 4. Development Workflow
1. **Schema First:** Define the Zod schema before building the form or the server action.
2. **Type Sharing:** Wherever possible, export types from the Zod schema to be used in both the UI and the Server Action.
3. **Validation:** Always validate on both ends: client-side for UX and server-side for security.