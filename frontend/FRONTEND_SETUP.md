# Frontend Setup — Hire Me Plis

## ✅ What's Been Done

### Core Scaffold

- **Next.js 16** with App Router (Turbopack enabled by default)
- **TypeScript 5** with strict mode
- **Tailwind CSS v4** with shadcn/ui (Base UI components)
- **Zustand** for state management with persistence
- **axios** HTTP client with Bearer token interceptor
- **WebSocket wrapper** for real-time chat

### Project Structure

```
frontend/
├── app/
│   ├── layout.tsx                  # Root layout with fonts
│   ├── page.tsx                    # / redirects to /dashboard
│   ├── (auth)/
│   │   ├── layout.tsx              # Centered card layout
│   │   ├── login/page.tsx          # Login form (dummy)
│   │   └── register/page.tsx       # Register form (dummy)
│   └── (app)/
│       ├── layout.tsx              # Sidebar + Topbar shell
│       ├── dashboard/page.tsx      # Stats cards, nudges placeholder
│       ├── jobs/page.tsx           # Job search UI (dummy)
│       ├── chat/page.tsx           # Chat interface (dummy)
│       ├── tracker/page.tsx        # Kanban board skeleton
│       └── cv/page.tsx             # CV upload + profile sections
├── components/
│   ├── ui/                         # shadcn components (8 installed)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── alert.tsx
│   │   ├── label.tsx
│   │   └── separator.tsx
│   └── layout/
│       ├── sidebar.tsx             # Left nav with active state
│       └── topbar.tsx              # Notifications + sign-out
├── lib/
│   ├── utils.ts                    # cn() helper from shadcn
│   ├── api.ts                      # Axios instance + interceptors
│   └── websocket.ts                # createChatSocket() for /chat/ws
├── store/
│   ├── auth.ts                     # User + token, syncs to cookie
│   ├── cv.ts                       # CV upload state + status
│   └── jobs.ts                     # Search results + loading
├── proxy.ts                        # Next.js 16 route guard (renamed from middleware.ts)
├── globals.css                     # Tailwind v4 + shadcn CSS variables
├── .env.local                      # API URLs + dev settings
└── package.json
```

### Design System

- **Tailwind v4** with OKLCH color space (modern CSS colors)
- **shadcn/ui v4** using Base UI (not Radix) — no Slot/asChild pattern
- CSS variables for theming: `--primary`, `--muted`, `--destructive`, `--sidebar-*`, etc.
- All components pre-configured in `globals.css`

### State Management (Zustand)

| Store     | Purpose                     | Persistence                        |
| --------- | --------------------------- | ---------------------------------- |
| `auth.ts` | `user` object + `token`     | Token only (localStorage + cookie) |
| `cv.ts`   | CV metadata + upload status | None (in-memory)                   |
| `jobs.ts` | Search results + query      | None (in-memory)                   |

Token synced to **both** `localStorage` (for axios interceptor) and a **cookie** (for `proxy.ts`).

### HTTP & WebSocket

- **api.ts**: Axios instance automatically adds `Authorization: Bearer {token}` to all requests
  - On 401: clears token and `localStorage` so proxy can redirect to login
- **websocket.ts**: Typed `createChatSocket()` wrapper
  - Matches `/chat/ws?token=<jwt>` protocol from api-contracts.md
  - Emits `{ type: "token" | "done" | "error", content: string }`

### Auth Flow

1. User fills `/login` or `/register` form
2. Frontend calls `POST /auth/login` or `POST /auth/register` via axios
3. Backend returns `{ access_token, user }`
4. Call `useAuthStore.setAuth(token, user)` → syncs to localStorage + cookie
5. `proxy.ts` sees cookie and allows navigation
6. **On page load**: proxy checks cookie; if missing, redirects to `/login`

### Development Auth Bypass

For testing **without a backend**, set in `.env.local`:

```bash
NEXT_PUBLIC_SKIP_AUTH=true
```

This makes `proxy.ts` skip all auth checks. You can now visit `/dashboard`, `/jobs`, `/chat`, `/tracker`, `/cv` without logging in.

**Remove or set to `false` before shipping:**

```bash
NEXT_PUBLIC_SKIP_AUTH=false
```

## 🚀 How to Run

```bash
cd frontend

# Install deps (already done)
npm install

# Start dev server
npm run dev
# → http://localhost:3000

# Build for production
npm run build

# Start production build
npm start
```

## 📝 What's Left to Implement

Each page has `TODO` comments marking exactly where integration starts:

### Pages

- **Login/Register**: Wire `POST /auth/login` and `POST /auth/register` → call `useAuthStore.setAuth()` → `router.push('/dashboard')`
- **Dashboard**: Fetch `GET /dashboard/stats` on mount → populate stat cards
- **Job Hunter**:
  - Wire search input → `POST /jobs/search`
  - Render `useJobsStore.results` as job cards
  - Each card links to the job posting
- **Chat**:
  - Create `createChatSocket()` on mount with a stable `session_id` per session
  - Wire message input → send via socket → stream response tokens
  - Render message list with user/assistant bubbles
- **Tracker**:
  - Fetch `GET /applications` on mount
  - Render Kanban board using dnd-kit (not yet installed)
  - Wire `PATCH /applications/:id/status` on drag-and-drop
  - Wire card editing form → `PATCH /applications/:id`
- **CV Builder**:
  - Wire file upload → `POST /cv/upload` → poll `GET /cv/status`
  - Render profile sections from `GET /cv/profile`
  - Wire section editors → `PATCH /cv/profile`
  - Wire export → `POST /cv/export`

### Missing Dependencies (for Phase 2)

- `dnd-kit` — for Kanban drag-and-drop
- `@fullcalendar/react` — for calendar view
- `react-hook-form` — form state (already installed, not used yet)

These can be installed when Pillar 2 (Tracker) and Pillar 3 (Calendar) implementation begins.

## 🔧 Key Files to Know

| File                            | Purpose                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| `proxy.ts`                      | Route guard: redirects unauthenticated requests to `/login` |
| `lib/api.ts`                    | Axios + Bearer token + 401 handling                         |
| `lib/websocket.ts`              | WebSocket wrapper for chat streaming                        |
| `store/auth.ts`                 | User identity + token persistence                           |
| `components/layout/sidebar.tsx` | 5-route navigation with active state                        |
| `components/layout/topbar.tsx`  | Notifications bell + avatar + sign-out                      |
| `globals.css`                   | Tailwind v4 + shadcn design tokens                          |

## ✨ Design Notes

- **Sidebar**: Uses `--sidebar-*` CSS variables; active route gets `--sidebar-primary` background
- **Topbar**: Right-aligned notifications + avatar (sign-out on click)
- **Auth pages**: Centered card layout via `(auth)/layout.tsx`
- **App pages**: Full-height flex layout with sidebar + topbar
- **Colors**: OKLCH color space (e.g., `oklch(0.205 0 0)` = neutral 900)
- **Spacing**: Tailwind default scale; cards use rounded-lg with border

## 📋 Checklist Before Shipping

- [ ] Remove or set `NEXT_PUBLIC_SKIP_AUTH=false` in `.env.local`
- [ ] Implement all 5 page integrations (see above)
- [ ] Test auth flow: register → login → token refresh
- [ ] Test 401 logout: manually set a fake token, verify it clears on 401
- [ ] Install dnd-kit, @fullcalendar/\* when Tracker/Calendar work starts
- [ ] Run `npm run build` to check for TypeScript errors
- [ ] Test in production build: `npm run build && npm start`

## 🎯 Tech Stack Summary

| Layer         | Tech                  | Version |
| ------------- | --------------------- | ------- |
| Framework     | Next.js               | 16.2.6  |
| Language      | TypeScript            | 5.x     |
| UI Components | shadcn/ui + Base UI   | v4      |
| Styling       | Tailwind CSS          | v4      |
| State         | Zustand               | 5.x     |
| HTTP          | axios                 | 1.16.1  |
| Forms         | react-hook-form + zod | v7 + v4 |
| Chat          | native WebSocket      | —       |
| Runtime       | Node.js               | 20.9+   |

---

**Questions?** Check [architecture.md](../.claude/docs/architecture.md) and [api-contracts.md](../.claude/docs/api-contracts.md) in the project root.
