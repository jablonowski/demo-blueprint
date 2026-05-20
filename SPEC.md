# Specification: Visual-First Angular CRUD Demo with Design System & Figma MCP Integration

## 1. Project Overview & Objective

The goal is to build a high-fidelity, visual-first Angular frontend demo application. The primary purpose is to showcase a specific Design System. There is NO backend; instead, network requests must be mocked realistically using the `angular-in-memory-web-api` package. Data modifications (CRUD) should update the in-memory state so the UI reacts realistically.

### Tech Stack

| Concern | Package / Tool |
|---|---|
| Framework | Angular 19 (standalone components, no NgModules) |
| Routing | Angular Router — auth guards, layout-based routing |
| Data Mocking | `angular-in-memory-web-api` (use the version matching Angular 19, e.g. `^0.19.0`) |
| UI Components | `@jablonowski/dsb-components` |
| Design Tokens | `@jablonowski/dsb-tokens` |

### npm Installation

```bash
npm install @jablonowski/dsb-components @jablonowski/dsb-tokens angular-in-memory-web-api
```

---

## 2. Figma Reference & MCP Integration

### Figma Demo File

- **URL:** `https://www.figma.com/design/iJ92LuFOsPjO6avZ2anbwO/Design-System-Blueprint?node-id=22-11104&p=f&t=9Ycqu0oTCdtdorRv-0`
- **Figma Access Token:** stored in `$FIGMA_ACCESS_TOKEN` env var (see `~/.zshrc`) — referenced via `${env:FIGMA_ACCESS_TOKEN}` in `.vscode/mcp.json`
- **Target node:** `22-11104` — contains the "Auth Layout" and "Main Dashboard/CRUD Layout" frames.

### Instructions for the AI Assistant

1. **Fetch Layouts:** Connect to the Figma MCP server using the file token above. Locate the frames at node `22-11104` containing the "Auth Layout" and "Main Dashboard/CRUD Layout".
2. **Visual Truth:** Treat the dimensions, structural positioning, responsive grids, and spacing from Figma as the absolute visual truth for layout assembly.
3. **Audit Missing Components:** Compare the required layouts against the available components in `@jablonowski/dsb-components` (see Section 5) to identify structural pieces that must be built locally.

---

## 3. Architecture & Layout Specifications

### Root Component

`app.component.html` must contain **only** `<router-outlet />` — no other markup, no Angular default template placeholder content.

### Layout 1: Unauthenticated (Auth Layout)

- **Visuals:** Centered card shell containing the Login Form, matched precisely to the Figma "Auth Layout" frame.
- **Figma fidelity rule:** Render **only** what is visible in the Figma frame. Do not add, remove, or rearrange any element.
- **Components to use:**
  - Login form fields: `dsb-input` for username and password
  - Submit action: `dsb-button` (`variant="primary"`, `[fullWidth]="true"`, `type="submit"`)
  - Card shell: build a local `AuthCardComponent` (no `Card` component exists in the design system — see Section 5)

### Layout 2: Authenticated (Main Layout)

- **Figma fidelity rule:** Render **only** what is visible in the Figma frame. Do not invent extra components, cards, or sections that are absent from the design.

- **Header:** Use `dsb-header` from `@jablonowski/dsb-components`. Pass `brandName`, `logoSrc`, `logoHref`, and `navItems`. Note: `dsb-header` does **not** include a built-in user profile dropdown. Build a local `UserProfileMenuComponent` on top of `dsb-avatar` + `dsb-dropdown` and project it into the header via a content slot or place it adjacent in the layout shell.
  - `UserProfileMenuComponent` **must** render `<dsb-avatar [src]="avatarUrl" name="Admin User" size="sm" shape="circle" />` followed by the name label and a `dsb-dropdown` with options `["My Profile", "Sign Out"]`. It must be **always visible** in the header top-right area when authenticated.
- **Footer:** Use `dsb-footer` from `@jablonowski/dsb-components`. Pass `brandName`, `copyright`, `columns`, and `legalLinks`.
- **Main Content Area:** A responsive CSS grid container wrapping the active route view. Build this as a local `MainLayoutComponent`.

---

## 4. Route & Page Specifications

### Route A: `/login`

- **Credentials:** Hardcoded — username `admin`, password `admin`.
- **Authentication Simulation:** On success, write `isLoggedIn: true` to `localStorage` and redirect to `/dashboard`.
- **Validation:** Angular Reactive Forms with `Validators.required`. On invalid submission, pass `[hasError]="true"` and `[errorMessage]="..."` to `dsb-input` to trigger its native error state.
- **Guard:** An anonymous/login guard — if `isLoggedIn` is already `true`, redirect immediately to `/dashboard`.

**Login card must render exactly these elements (top to bottom, matching the Figma "Auth Layout" frame):**

1. **Heading** — `"Welcome back"` (large, semibold, using `--ds-decisions-font-size-2xl` and `--ds-decisions-font-weight-semibold`).
2. **Subtitle** — `"Sign in to your account to continue"` (secondary text colour, `--ds-decisions-color-text-secondary`).
3. **Username field** — `dsb-input` with `label="Username"` and `placeholder="Enter your username"`.
4. **Password field** — `dsb-input` with `label="Password"`, `type="password"`, and `placeholder="Enter your password"`.
5. **Remember me + Forgot password row** — a flex row with:
   - `dsb-checkbox` with `label="Remember me"` (no backend action required; purely visual).
   - A plain `<a>` link styled with `--ds-decisions-color-text-primary` and `text-decoration: underline` reading `"Forgot password?"` (no action required).
6. **Submit button** — `dsb-button` (`variant="primary"`, `[fullWidth]="true"`, `type="submit"`) with label `"Sign In"`.
7. **Sign up prompt** — centred text line: `"Don't have an account?"` followed by an `<a>` link reading `"Sign up"` (no action required).

Do **not** add any other elements to the login card.

### Route B: `/dashboard` (Protected)

A grid-based monitoring dashboard with mock infrastructure health data. Match the Figma "Main Dashboard" frame **exactly** — do not add or omit any tile.

Build the following tiles using a local `MetricCardComponent`. Each card has:
- a **title** label (small, uppercase, secondary colour)
- a **primary value** (large focal number)
- an optional **trend badge** (`dsb-tag`)
- an optional **sub-label** (small secondary text below the value)
- an optional **content slot** for richer card bodies

Cards (left-to-right, top-to-bottom as in Figma):

1. **Active Users** — value `1,284`, trend badge `dsb-tag` (`variant="success"`, label `+12%`), sub-label `"vs last 7 days"` (secondary text, placed directly below the value).
2. **Avg Response Time** — value `142ms`, trend badge `dsb-tag` (`variant="success"`, label `-8ms`), sub-label `"vs last 7 days"`.
3. **Error Rate** — value `0.04%`, trend badge `dsb-tag` (`variant="danger"`, label `+0.01%`), sub-label `"vs last 7 days"`.
4. **Uptime (30d)** — value `99.97%`, trend badge `dsb-tag` (`variant="success"`, label `Stable`), sub-label `"last 30 days"`.
5. **Request Throughput** — a local `ThroughputChartComponent`. Render a simple **CSS-only bar chart** (no external charting library) showing 7 bars representing daily requests (mock data). Each bar is a `<div>` with `height` set as a percentage of the max value. Use `--ds-decisions-color-*` tokens for bar fills. Title: `"Request Throughput"`, x-axis: day labels (Mon–Sun), y-axis: implicit (bar heights).
6. **Service Health** — status rows using `dsb-tag` (`variant="success"` for Online, `variant="danger"` for Offline). Services: `API Gateway` (Online), `Auth Service` (Online), `Storage Service` (Online), `Analytics Engine` (Offline), `Cache Layer` (Online).
7. **Data Summary** — `dsb-list` + `dsb-list-item` showing: Requests/min `4,820`, Avg Response `142 ms`, Error Rate `0.04%`, Uptime (30d) `99.97%`.
8. **System Logs** — local `LogsCardComponent`: scrollable, monospace terminal, auto-appends a new fake log line every 3 seconds.

### Route C: `/users` (Protected CRUD Page)

A full CRUD interface using `dsb-table`.

**Page header row (above the table):**
- Left: page heading `"Team Members"` (h1, semibold).
- Right: `dsb-button` (`variant="primary"`, label `"Invite Member"`) — no action required, decorative only.

**Table Columns (in this order):**

| Column | `key` | Rendered via |
|---|---|---|
| Avatar | `avatar` | `<ng-template>` — render `<dsb-avatar [src]="row['avatar']" [name]="row['name']" size="sm" shape="circle" />` |
| Name | `name` | Default text cell |
| Email | `email` | Default text cell |
| Role | `role` | `<ng-template>` — render `<dsb-tag [variant]="roleVariant(row['role'])" size="sm">{{ row['role'] }}</dsb-tag>` where `roleVariant` maps `Admin` → `success`, `Editor` → `info`, `Viewer` → `default` |
| Status | `status` | `<ng-template>` — render `<dsb-tag [variant]="row['status'] === 'Active' ? 'success' : 'warning'" size="sm">{{ row['status'] }}</dsb-tag>` |
| Joined | `joinedDate` | Default text cell |
| Actions | — | `<ng-template>` — render three inline `dsb-button` elements: `variant="ghost"` `"Details"`, `variant="secondary"` `"Edit"`, `variant="danger"` `"Delete"`. Wire each to the corresponding method. |

> **Critical:** Every column that renders a component (avatar, tag, buttons) MUST use the `<ng-template let-row>` pattern with `dsb-column`. Plain text output for those columns is incorrect.

**CRUD Operations via In-Memory API:**
- **Read:** Fetch `/api/users` on `ngOnInit` via `HttpClient`.
- **Delete:** Trigger from the **Delete** button in the Actions column. Show a `dsb-modal` (`title="Confirm Deletion"`, `size="sm"`) with the text `"Are you sure you want to remove [name]? This action cannot be undone."` and two footer buttons: `dsb-button` `variant="secondary"` `"Cancel"` and `dsb-button` `variant="danger"` `"Delete"`. On confirm, send `DELETE /api/users/:id` then reload.
- **Details:** Trigger from the **Details** button. Show a `dsb-modal` (`title="User Details"`, `size="md"`) containing: `dsb-avatar` (size `lg`), user name as heading, and a `dsb-list` with items for Email, Role, Status, and Joined date. Footer: single `dsb-button` `variant="secondary"` `"Close"`.
- **Edit:** Trigger from the **Edit** button. Show a `dsb-modal` (`title="Edit Member"`, `size="md"`) with a pre-populated Reactive Form: `dsb-input` for Name and Email, `dsb-dropdown` for Role. Footer buttons: `dsb-button` `variant="secondary"` `"Cancel"` and `dsb-button` `variant="primary"` `"Save Changes"`. Save triggers `PUT /api/users/:id` then reload.

---

## 5. Component Reference

### Available in `@jablonowski/dsb-components`

All components are **standalone**. Import them directly into the component's `imports` array.

| Selector | Key `@Input()` | Key `@Output()` |
|---|---|---|
| `dsb-button` | `variant: 'primary'\|'secondary'\|'ghost'\|'danger'`, `size: 'sm'\|'md'\|'lg'`, `disabled`, `loading`, `fullWidth`, `type: 'button'\|'submit'\|'reset'` | `onClick` |
| `dsb-input` | `label`, `type`, `placeholder`, `size: 'sm'\|'md'\|'lg'`, `hasError`, `errorMessage`, `hint`, `disabled` | `valueChange` |
| `dsb-checkbox` | `label`, `checked`, `disabled`, `hasError`, `errorMessage`, `hint` | `checkedChange` |
| `dsb-radio-group` | `options: RadioOption[]`, `legend`, `disabled`, `hasError`, `errorMessage`, `inline` | `valueChange` |
| `dsb-dropdown` | `options: DropdownOption[]`, `label`, `placeholder`, `size: 'sm'\|'md'\|'lg'`, `disabled`, `hasError`, `errorMessage` | `valueChange` |
| `dsb-header` | `brandName`, `logoSrc`, `logoAlt`, `logoHref`, `navItems: NavItem[]`, `ctaLabel`, `ctaHref` | — |
| `dsb-footer` | `brandName`, `logoSrc`, `logoHref`, `tagline`, `columns: FooterColumn[]`, `copyright`, `legalLinks: FooterLink[]` | — |
| `dsb-tag` | `variant: 'default'\|'success'\|'warning'\|'danger'\|'info'`, `size: 'sm'\|'md'` | — |
| `dsb-avatar` | `src`, `alt`, `name` (used for initials fallback), `size: 'sm'\|'md'\|'lg'`, `shape: 'circle'\|'rounded'\|'square'` | — |
| `dsb-modal` | `open`, `title`, `size: 'sm'\|'md'\|'lg'`, `closeOnBackdrop` | `openChange`, `closed` |
| `dsb-table` | `rows: Record<string, unknown>[]`, `striped`, `hoverable`, `loading`, `rowClickable`, `emptyMessage` | `rowClick` |
| `dsb-column` | `key` (required), `header`, `width`, `align: 'left'\|'center'\|'right'` | — |
| `dsb-list` | `divided`, `bordered`, `compact` | — |
| `dsb-list-item` | `label`, `description`, `meta`, `variant`, `indicator` | — |
| `dsb-accordion` | `exclusive` | — |
| `dsb-accordion-item` | `title`, `open`, `disabled` | — |
| `dsb-breadcrumbs` | `items: BreadcrumbItem[]` | — |

> `dsb-table` uses `dsb-column` as a child directive for column definitions, paired with `<ng-template>` for custom cell rendering. **Any column that needs to render a component (avatar, tag, buttons) must use the `<ng-template let-row>` syntax shown below. Outputting raw field values for those columns is incorrect.**
>
> ```html
> <dsb-table [rows]="rows">
>   <!-- plain text column -->
>   <dsb-column key="name" header="Name" />
>
>   <!-- custom cell with ng-template -->
>   <dsb-column key="role" header="Role">
>     <ng-template let-row>
>       <dsb-tag [variant]="roleVariant(row['role'])" size="sm">{{ row['role'] }}</dsb-tag>
>     </ng-template>
>   </dsb-column>
>
>   <!-- avatar cell -->
>   <dsb-column key="avatar" header="" width="56px">
>     <ng-template let-row>
>       <dsb-avatar [src]="row['avatar']" [name]="row['name']" size="sm" shape="circle" />
>     </ng-template>
>   </dsb-column>
> </dsb-table>
> ```

### NOT Available — Build Locally in `src/app/shared/components/`

The following components **do not exist** in `@jablonowski/dsb-components` and must be implemented locally:

| Component | Purpose |
|---|---|
| `AuthCardComponent` | Centered card shell for the login page |
| `MainLayoutComponent` | Authenticated app shell (header + router-outlet + footer) |
| `MetricCardComponent` | Dashboard metric tile (value, sub-label, optional trend badge, optional content slot) |
| `ThroughputChartComponent` | CSS-only bar chart showing 7-day request throughput |
| `LogsCardComponent` | Scrollable monospace terminal log viewer |
| `UserProfileMenuComponent` | Header profile area combining `dsb-avatar` + name label + `dsb-dropdown` |

> There is **no** `Card`, `Badge`, `FormField`, or `Typography` component in the design system. For role/status badges use `dsb-tag`. For form field wrappers, compose `dsb-input` / `dsb-dropdown` directly.

**Constraint:** Local components must NOT use hardcoded CSS values. Use design token CSS custom properties exclusively (see Section 6).

---

## 6. Design Tokens (`@jablonowski/dsb-tokens`)

The package outputs CSS custom properties generated by Style Dictionary using a three-tier architecture (options → decisions → component). The CSS file is at `dist/css/variables.css`. SCSS variables are at `dist/scss/_variables.scss`.

**Global import in `styles.css`:**

```css
@import '@jablonowski/dsb-tokens/dist/css/variables.css';
```

**Token naming pattern:** `--ds-{tier}-{category}-{name}`

Key decision-tier tokens for use in local components:

| Token | Purpose |
|---|---|
| `--ds-decisions-color-text-primary` | Primary body/label text |
| `--ds-decisions-color-text-secondary` | De-emphasised text |
| `--ds-decisions-color-text-placeholder` | Placeholder / empty state text |
| `--ds-decisions-color-surface-base` | Default card / control background |
| `--ds-decisions-color-surface-subtle` | Recessed surfaces (table header, etc.) |
| `--ds-decisions-color-border-subtle` | Layout dividers |
| `--ds-decisions-color-feedback-success-surface` | Success tinted background |
| `--ds-decisions-color-feedback-error-icon` | Error state color |
| `--ds-decisions-font-size-md` | Default body text (14 px) |
| `--ds-decisions-font-size-xl` | Section headings (16 px) |
| `--ds-decisions-font-weight-semibold` | Headings, modal titles |
| `--ds-decisions-shadow-modal` | Modal elevation |
| `--ds-decisions-shadow-dropdown` | Floating panel elevation |
| `--ds-decisions-motion-duration-base` | Standard transition duration |
| `--ds-decisions-motion-easing-standard` | Standard easing |

---

## 7. Mock Data Schema (`InMemoryDbService`)

Define an in-memory collection named `users` seeded with at least 5 records:

```json
{
  "id": 1,
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
  "role": "Admin",
  "status": "Active",
  "joinedDate": "2024-01-15"
}
```

Valid `role` values: `"Admin"`, `"Editor"`, `"Viewer"`.
Valid `status` values: `"Active"`, `"Inactive"`.

---

## 8. Expected Deliverables

Generate boilerplate TypeScript and HTML for:

1. **App configuration** — `app.config.ts` with `provideRouter`, `provideHttpClient`, and `InMemoryWebApiModule` (or `provideInMemoryWebApi`) configuration. Angular 19 standalone bootstrap.
2. **Root component** — `app.component.html` must contain **only** `<router-outlet />`. Remove all Angular default placeholder content.
3. **Routing** — `app.routes.ts` with layout-wrapper routes, `AuthGuard` (redirects to `/login` if `isLoggedIn` is falsy), and an anonymous guard for `/login`.
4. **Auth Service** — `AuthService` wrapping `localStorage` reads/writes for the `isLoggedIn` key.
5. **In-Memory Data Service** — `AppInMemoryDataService implements InMemoryDbService` seeding the `users` collection with all fields from Section 7.
6. **Users HTTP Service** — `UsersService` covering `GET /api/users`, `GET /api/users/:id`, `PUT /api/users/:id`, and `DELETE /api/users/:id`.
7. **MetricCardComponent** — accepts `title`, `value`, `trend`, `trendVariant`, and `subLabel` inputs; projects a content slot for richer card bodies. Uses `--ds-decisions-*` tokens exclusively.
8. **ThroughputChartComponent** — CSS-only 7-bar chart using mock daily data. No external libraries.
9. **Users table** — all 7 columns implemented with `<ng-template let-row>` for avatar, role, status, and actions columns as specified in Section 4.