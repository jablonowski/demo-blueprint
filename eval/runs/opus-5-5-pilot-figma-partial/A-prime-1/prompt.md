# Specification: Visual-First Angular CRUD Demo

> This is `S0` — the shared specification. It is identical in every arm of the evaluation.
> It states what the application must do and what each screen must contain. It never names
> a component, a CSS class, a token or a value, because those are what the arms differ by.
>
> See `eval/PROTOCOL.md`. Do not add implementation detail here to make a run go smoother:
> anything added is added to all five arms at once, and stops being measurable.

## 1. Project Overview & Objective

Build a high-fidelity, visual-first Angular frontend demo application. There is no backend;
network requests are mocked with `angular-in-memory-web-api`. CRUD operations must update
the in-memory state so the UI reacts realistically.

### Tech Stack

| Concern | Package / Tool |
|---|---|
| Framework | Angular 19 (standalone components, no NgModules) |
| Routing | Angular Router — auth guards, layout-based routing |
| Data Mocking | `angular-in-memory-web-api` (version matching Angular 19, e.g. `^0.19.0`) |

```bash
npm install angular-in-memory-web-api
```

Anything else this application is built on is described in the arm overlay, if there is one.

## 2. Figma Reference

- **URL:** `https://www.figma.com/design/iJ92LuFOsPjO6avZ2anbwO/Design-System-Blueprint?node-id=22-11104`
- **Target node:** `22-11104` — the "Auth Layout" and "Main Dashboard/CRUD Layout" frames
- **Modal nodes:** `22:11448` (edit), `22:11492` (details) — exact modal body layout, spacing and colours

A Figma access token is available as `$FIGMA_ACCESS_TOKEN`, and the Figma MCP server is
configured for this session. Both are verified against this node before the run starts —
if either were unavailable you would not have been given this document.

**Treat Figma as the visual truth.** Dimensions, structural positioning, responsive grids
and spacing come from the frames. Render only what is visible there: do not add, remove or
rearrange elements, and do not invent cards or sections that are absent from the design.

## 3. Architecture & Layout

### Root component

`app.component.html` contains **only** `<router-outlet />`. No other markup, no leftover
Angular placeholder content.

### Layout 1 — unauthenticated

A centred card shell containing the login form, matched to the Figma "Auth Layout" frame.

### Layout 2 — authenticated

An application shell with a header, a main content area for the active route, and a footer.

**Header.** Carries the product brand, a logo, and primary navigation. In its top-right
corner, always visible while authenticated, sits a user profile control: an avatar, the
signed-in user's name — `Admin User` — and a trigger that opens a menu containing
**My Profile** and **Sign Out**. Sign-out is handled by the layout.

That menu sits at the right edge of the viewport, so it must open leftward and remain fully
visible — a menu that opens off-screen or is clipped by the viewport edge is a defect.
It closes when the user clicks outside it.

**Footer.** Carries the brand, a copyright line, columns of links, and a row of legal links.

**Main content area.** A responsive grid container wrapping the active route view.

## 4. Routes & Pages

### Route A — `/login`

- **Credentials:** hardcoded — username `admin`, password `admin`
- **Authentication:** on success write `isLoggedIn: true` to `localStorage` and redirect to
  `/dashboard`
- **Validation:** Angular reactive forms with `Validators.required`. An invalid submission
  puts the offending field into an error state with a message
- **Guard:** if `isLoggedIn` is already true, redirect straight to `/dashboard`

The login card contains exactly these elements, top to bottom, matching the Figma frame:

1. **Heading** — `"Welcome back"`, large and semibold
2. **Subtitle** — `"Sign in to your account to continue"`, in a de-emphasised text colour
3. **Username field** — labelled `Username`, placeholder `Enter your username`
4. **Password field** — labelled `Password`, obscured input, placeholder `Enter your password`
5. **Remember me / forgot password row** — a flex row containing a checkbox labelled
   `Remember me` (visual only, no behaviour) and a link reading `Forgot password?`
   (no action), underlined, in the primary text colour
6. **Submit button** — full width, primary emphasis, labelled `Sign In`
7. **Sign-up prompt** — a centred line reading `Don't have an account?` followed by a link
   reading `Sign up` (no action)

Add nothing else to the login card.

### Route B — `/dashboard` (protected)

A grid-based monitoring dashboard with mock infrastructure health data. Match the Figma
"Main Dashboard" frame exactly — do not add or omit a tile.

Each metric tile carries a title label (small, uppercase, de-emphasised), a primary value
(large and focal), an optional trend badge signalling direction, and an optional sub-label
beneath the value. Some tiles carry richer content in place of a single value.

Tiles, left to right and top to bottom as in Figma:

1. **Active Users** — value `1,284`, trend `+12%` reading as positive, sub-label
   `"vs last 7 days"`
2. **Avg Response Time** — value `142ms`, trend `-8ms` reading as positive, sub-label
   `"vs last 7 days"`
3. **Error Rate** — value `0.04%`, trend `+0.01%` reading as negative, sub-label
   `"vs last 7 days"`
4. **Uptime (30d)** — value `99.97%`, trend `Stable` reading as positive, sub-label
   `"last 30 days"`
5. **Request Throughput** — a bar chart, seven bars, Monday to Sunday, each bar's height a
   percentage of the maximum. **No charting library.** Title `"Request Throughput"`, day
   labels on the x-axis. The bars render in the darkest foreground colour available
6. **Service Health** — status rows, each a service name and a status indicator reading as
   positive or negative: `API Gateway` Online, `Auth Service` Online, `Storage Service`
   Online, `Analytics Engine` Offline, `Cache Layer` Online
7. **Data Summary** — a list of label/value pairs: Requests/min `4,820`, Avg Response
   `142 ms`, Error Rate `0.04%`, Uptime (30d) `99.97%`
8. **System Logs** — a scrollable terminal-style log viewer in a monospace face, appending
   a new fake log line every 3 seconds

### Route C — `/users` (protected, CRUD)

A full CRUD interface over a data table.

**Page header row**, above the table: on the left the page heading `"Team Members"` (`h1`,
semibold); on the right a primary action labelled `"Invite Member"` that opens the invite
dialog.

**Table columns**, in this order:

| Column | Field | Cell content |
|---|---|---|
| Avatar | `avatar` | the user's avatar image, small, circular, falling back to initials |
| Name | `name` | text |
| Email | `email` | text |
| Role | `role` | a badge, toned by role as the Figma frame shows |
| Status | `status` | a badge, toned by status as the Figma frame shows |
| Joined | `joinedDate` | text |
| Actions | — | three actions per row: `Details` (least emphasis), `Edit` (secondary), `Delete` (destructive) |

#### Dialogs

Four, all modal over the table.

**Delete confirmation** — small. Title `"Confirm Deletion"`. Body: `Are you sure you want
to remove` followed by the member's name in bold, then `This action cannot be undone.`
Footer, right-aligned: `Cancel`, and a destructive `Delete`. Confirming issues
`DELETE /api/users/:id`, reloads the list, closes the dialog and clears the selection.
Closes on backdrop click.

**Member details** — medium, read-only. Matches Figma node `22:11492`.

- Header: `Member Details` alongside a small `Read only` badge — the two sit together on one
  line, so the header is custom rather than a plain title
- A user row: a circular avatar showing the member's initials, their name, and beneath it
  `Member since` followed by the joining month and year in words (e.g. `January 2024`)
- Read-only fields, each a label above a value in a boxed field that reads as disabled:
  `First name` and `Last name` side by side in two columns, then `Email address`, then
  `Role`, each label de-emphasised
- A status row: the label `Status` beside the member's status badge
- Footer, split: on the left the note `To make changes, request Admin access.`; on the
  right a `Close` action

**Edit member** — medium. Title `"Edit Member"`. Matches Figma node `22:11448`.

- The same user row as the details dialog
- A reactive form, all fields required: `First name` and `Last name` side by side,
  `Email address`, and `Role` as a selector offering `Admin`, `Editor`, `Viewer`
- Status is shown as a badge and is **not** editable
- Footer, split: on the left a destructive-outline action `Delete user` which closes this
  dialog and opens the delete confirmation with the selection intact; on the right `Cancel`
  and a primary `Save changes`

Opening the dialog splits the member's name into first and last; saving recombines them,
issues `PUT /api/users/:id` and reloads.

**Invite member** — medium. Title `"Invite Member"`. The same form as the edit dialog —
first and last name side by side, email, role selector with a `Select role…` placeholder —
and no user row. Footer, right-aligned: `Cancel` and a primary `Send Invite`. Confirming
combines the names, generates an avatar URL, sets status `Active` and today's date as the
joining date, issues `POST /api/users`, reloads and resets the form.

## 5. Mock data (`InMemoryDbService`)

A collection named `users`, seeded with at least five records:

```json
[
  { "id": 1, "name": "Jane Doe",      "email": "jane.doe@example.com",      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",  "role": "Admin",  "status": "Active",   "joinedDate": "2024-01-15" },
  { "id": 2, "name": "John Smith",    "email": "john.smith@example.com",    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=John",  "role": "Editor", "status": "Active",   "joinedDate": "2024-02-20" },
  { "id": 3, "name": "Alice Johnson", "email": "alice.johnson@example.com", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice", "role": "Viewer", "status": "Active",   "joinedDate": "2024-03-10" },
  { "id": 4, "name": "Bob Martinez",  "email": "bob.martinez@example.com",  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",   "role": "Editor", "status": "Inactive", "joinedDate": "2024-04-05" },
  { "id": 5, "name": "Carol White",   "email": "carol.white@example.com",   "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol", "role": "Viewer", "status": "Active",   "joinedDate": "2024-05-18" }
]
```

Valid roles: `Admin`, `Editor`, `Viewer`. Valid statuses: `Active`, `Inactive`.

```ts
importProvidersFrom(HttpClientInMemoryWebApiModule.forRoot(AppInMemoryDataService, {
  dataEncapsulation: false,
  delay: 300,
  passThruUnknownUrl: true
}))
```

## 6. Deliverables

1. **`app.config.ts`** — `provideRouter(routes)`, `provideHttpClient(withInterceptorsFromDi())`,
   the in-memory API above
2. **`app.component.html`** — `<router-outlet />` only
3. **`app.routes.ts`** — `''` redirects to `/login`; `/login` behind a login guard, lazily
   loaded; an authenticated layout wrapper behind an auth guard, lazily loading the shell
   with `/dashboard` and `/users` as children; `'**'` redirects to `/login`
4. **`AuthService`** — wraps `localStorage`: `isLoggedIn()`, `login(u, p)` checking
   `admin`/`admin`, `logout()`
5. **`AppInMemoryDataService implements InMemoryDbService`** — `createDb()` returning the
   seed data above
6. **`UsersService`** — `getAll()`, `getById(id)`, `update(id, user)`, `create(user)`,
   `delete(id)`
7. **Login, dashboard and users pages**, and whatever local components the layouts need
8. The application builds and runs with `npx @angular/cli@19 serve`, and logging in with
   `admin` / `admin` reaches the dashboard

## Acceptance

- Every route renders and every dialog opens and closes
- Create, read, update and delete all round-trip through the in-memory API and the table
  reflects the change
- The rendered screens match the Figma frames in structure, spacing and proportion
- No console errors


---

# Arm A′ — a styleguide, as a document

The agent receives `S0.md` plus the text below: a palette, a type scale, spacing, radii,
elevation and motion, written down, together with the CSS for a few recurring pieces.

**This is a design system.** It is delivered as prose and CSS pasted into the prompt rather
than as an installable artifact, which is where most organisations actually are: a Figma
file, a page in Confluence, and a paragraph in the onboarding doc.

That makes A′ the uncomfortable arm. If it scores like C, the machine-readable layer is not
earning its keep and the finding belongs in the book. If it does not — if the values drift,
or the agent invents a sixth grey — then the difference between documenting a system and
shipping one is measurable, which is the argument the whole project rests on.

Everything below is lifted verbatim from `spec-no-ds.md`. It is the condition under test,
not something to improve.

---

## Design values

Define these CSS custom properties in `styles.css` under `:root`. Reference them in local component styles.

```css
/* styles.css */

:root {
  /* Typography */
  --font-size-xs:   11px;
  --font-size-sm:   12px;
  --font-size-base: 14px;
  --font-size-lg:   16px;
  --font-size-xl:   18px;
  --font-size-2xl:  24px;
  --font-weight-normal:   400;
  --font-weight-medium:   500;
  --font-weight-semibold: 600;

  /* Text colours */
  --color-text-primary:     #111111;
  --color-text-secondary:   #666666;
  --color-text-muted:       #999999;
  --color-text-placeholder: #b3b3b3;

  /* Surfaces */
  --color-surface-page:     #fafafa;
  --color-surface-card:     #ffffff;
  --color-surface-subtle:   #f5f5f5;
  --color-surface-recessed: #f0f0f0;

  /* Borders */
  --color-border:       #e5e5e5;
  --color-border-input: #d4d4d4;

  /* Semantic */
  --color-primary: #111111;
  --color-danger:  #d93025;

  /* Elevation */
  --shadow-card:  0 1px 3px rgba(0, 0, 0, .08);
  --shadow-modal: 0 8px 32px rgba(0, 0, 0, .14);

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 10px;

  /* Motion */
  --duration-fast: 100ms;
  --duration-base: 150ms;
  --easing-standard: ease;
}

/* Global reset */
*, *::before, *::after { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background: var(--color-surface-page);
}
a { color: inherit; }
button { font-family: inherit; }
```

---

---

## Recurring component styles

**Tag CSS (global in `styles.css`):**

```css
.tag { display:inline-flex; align-items:center; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:500; white-space:nowrap; }
.tag-success { background:#f0fdf4; color:#16a34a; }
.tag-warning { background:#fefce8; color:#ca8a04; }
.tag-danger  { background:#fef2f2; color:#dc2626; }
.tag-info    { background:#eff6ff; color:#2563eb; }
.tag-default { background:#f5f5f5; color:#555555; }
```
