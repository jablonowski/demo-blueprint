# Specification: Visual-First Angular CRUD Demo (No Design System)

## 1. Project Overview & Objective

The goal is to build a high-fidelity, visual-first Angular frontend demo application. All UI components are built locally using plain HTML and CSS — **no external design system or component library**. There is NO backend; instead, network requests must be mocked realistically using the `angular-in-memory-web-api` package. Data modifications (CRUD) should update the in-memory state so the UI reacts realistically.

### Tech Stack

| Concern | Package / Tool |
|---|---|
| Framework | Angular 19 (standalone components, no NgModules) |
| Routing | Angular Router — auth guards, layout-based routing |
| Data Mocking | `angular-in-memory-web-api` (`^0.19.0`) |
| UI Components | **All built locally** — no external component library |
| Styling | Plain CSS — custom properties defined in `styles.css` |

### npm Installation

```bash
npm install angular-in-memory-web-api
```

> Do **not** install `@jablonowski/dsb-components` or `@jablonowski/dsb-tokens`. All UI widgets are native HTML elements styled with the classes defined in this spec.

---

## 2. Figma Reference

### Figma Demo File

- **URL:** `https://www.figma.com/design/iJ92LuFOsPjO6avZ2anbwO/Design-System-Blueprint?node-id=22-11104&p=f&t=9Ycqu0oTCdtdorRv-0`
- **Figma Access Token:** stored in `$FIGMA_ACCESS_TOKEN` env var (see `~/.zshrc`).
- **Target node:** `22-11104` — contains the "Auth Layout" and "Main Dashboard/CRUD Layout" frames.
- **Modal nodes:** `22:11448` (modal-edit), `22:11492` (modal-details).

### Instructions for the AI Assistant

1. **Fetch Layouts:** Connect to the Figma MCP server using the file token above. Locate the frames at node `22-11104`.
2. **Visual Truth:** Treat the Figma dimensions, structural positioning, responsive grids, and spacing as the absolute visual truth for layout assembly.
3. **Implement directly:** Every component is local. Match the Figma visual output using plain HTML and the CSS classes and values defined in Sections 5 and 6.
4. **Read Section 9 first** — it lists implementation gotchas specific to the no-DS approach.

---

## 3. Architecture & Layout Specifications

### Root Component

`app.component.html` must contain **only** `<router-outlet />` — no other markup, no Angular default template placeholder content.

### Layout 1: Unauthenticated (Auth Layout)

- **Visuals:** Centered card shell containing the Login Form, matched precisely to the Figma "Auth Layout" frame.
- **Figma fidelity rule:** Render **only** what is visible in the Figma frame.
- **Components to use:**
  - Card shell: local `AuthCardComponent`
  - Form inputs: native `<input>` in `.field-group` wrappers with `<label>`
  - Submit action: `<button class="btn btn-primary btn-full" type="submit">`
  - "Remember me": native `<input type="checkbox">` + `<label>`

### Layout 2: Authenticated (Main Layout)

Build a local `MainLayoutComponent` with a sticky header, scrollable main content area, and footer.

**`AppHeaderComponent`** (selector `app-header`) — built locally in `src/app/shared/components/app-header/`:

```html
<!-- app-header.component.html -->
<header class="app-header">
  <div class="header-brand">
    <a routerLink="/dashboard" class="brand-link">{{ brandName }}</a>
  </div>
  <nav class="header-nav">
    <a *ngFor="let item of navItems" [routerLink]="item.href" routerLinkActive="active">{{ item.label }}</a>
  </nav>
  <div class="header-right">
    <ng-content></ng-content>
  </div>
</header>
```

```css
.app-header { display:flex; align-items:center; justify-content:space-between; padding:0 24px; height:56px; background:#ffffff; border-bottom:1px solid #e5e5e5; position:sticky; top:0; z-index:50; }
.brand-link { font-size:15px; font-weight:700; color:#111111; text-decoration:none; }
.header-nav { display:flex; gap:4px; }
.header-nav a { padding:6px 12px; border-radius:6px; font-size:14px; font-weight:500; color:#666666; text-decoration:none; transition:background .15s, color .15s; }
.header-nav a.active, .header-nav a:hover { background:#f5f5f5; color:#111111; }
.header-right { display:flex; align-items:center; }
```

**`UserProfileMenuComponent`** (selector `app-user-profile-menu`) — always visible top-right of header. Custom CSS dropdown; no library component.

```ts
// user-profile-menu.component.ts
@HostListener('document:click', ['$event'])
onDocumentClick(e: MouseEvent) {
  if (!this.el.nativeElement.contains(e.target)) this.isOpen = false;
}
toggleMenu(e: MouseEvent) { e.stopPropagation(); this.isOpen = !this.isOpen; }
```

```html
<div class="profile-trigger" (click)="toggleMenu($event)">
  <app-avatar [name]="'Admin User'" size="sm" shape="circle"></app-avatar>
  <span class="profile-name">Admin User</span>
  <span class="chevron">▾</span>
</div>
@if (isOpen) {
  <div class="menu-panel">
    <button class="menu-item" type="button">My Profile</button>
    <button class="menu-item" type="button" (click)="onSignOut()">Sign Out</button>
  </div>
}
```

```css
:host { position:relative; display:flex; align-items:center; }
.profile-trigger { display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:6px; cursor:pointer; border:none; background:none; font-family:inherit; }
.profile-trigger:hover { background:#f5f5f5; }
.profile-name { font-size:13px; font-weight:500; color:#111111; }
.chevron { font-size:10px; color:#999999; }
.menu-panel { position:absolute; top:calc(100% + 8px); right:0; left:auto; background:#ffffff; border:1px solid #e5e5e5; border-radius:8px; box-shadow:0 4px 16px rgba(0,0,0,.10); min-width:160px; z-index:100; padding:4px; }
.menu-item { display:block; width:100%; padding:8px 12px; border:none; background:none; text-align:left; font-size:13px; color:#111111; cursor:pointer; border-radius:4px; font-family:inherit; }
.menu-item:hover { background:#f5f5f5; }
```

**`AppFooterComponent`** (selector `app-footer`) — built locally. Interface for columns:

```ts
interface FooterColumn { heading: string; links: { label: string; href: string }[]; }
```

**`MainLayoutComponent`** shell:

```html
<app-header [brandName]="'Blueprint'" [navItems]="navItems">
  <app-user-profile-menu (signOut)="onSignOut()"></app-user-profile-menu>
</app-header>
<main class="main-content">
  <router-outlet />
</main>
<app-footer [brandName]="'Blueprint'" [copyright]="'© 2025 Blueprint'" [columns]="footerColumns" [legalLinks]="legalLinks"></app-footer>
```

---

## 4. Route & Page Specifications

### Route A: `/login`

- **Credentials:** Hardcoded — username `admin`, password `admin`.
- **Authentication Simulation:** On success, write `isLoggedIn: true` to `localStorage` and redirect to `/dashboard`.
- **Validation:** Angular Reactive Forms with `Validators.required`. On invalid submission, add `.has-error` to the `.field-group` and show `<p class="field-error-msg">` below the input.
- **Guard:** If `isLoggedIn` is already `true`, redirect immediately to `/dashboard`.

**Login card must render exactly these elements (top to bottom, matching the Figma "Auth Layout" frame):**

1. **Heading** — `"Welcome back"` (`font-size:24px; font-weight:600; color:#111111`).
2. **Subtitle** — `"Sign in to your account to continue"` (`font-size:14px; color:#666666`).
3. **Username field** — `.field-group` with `<label>Username</label>` + `<input class="form-input" placeholder="Enter your username">`.
4. **Password field** — same structure, `type="password"`, placeholder `"Enter your password"`.
5. **Remember me + Forgot password row** — flex row with:
   - `<input type="checkbox" id="remember">` + `<label for="remember" class="checkbox-label">Remember me</label>`.
   - `<a href="#" class="link">Forgot password?</a>` (no action; `color:#111111; text-decoration:underline`).
6. **Submit button** — `<button class="btn btn-primary btn-full" type="submit">Sign In</button>`.
7. **Sign up prompt** — centred `<p>Don't have an account? <a href="#" class="link">Sign up</a></p>`.

Do **not** add any other elements to the login card.

**Form field CSS (place in `AuthCardComponent` styles or `styles.css`):**

```css
.field-group { display:flex; flex-direction:column; gap:5px; }
.field-group label { font-size:12px; font-weight:500; color:#111111; }
.form-input { border:1px solid #d4d4d4; border-radius:6px; padding:9px 12px; font-size:14px; color:#111111; background:#ffffff; outline:none; width:100%; box-sizing:border-box; font-family:inherit; }
.form-input:focus { border-color:#111111; }
.has-error .form-input { border-color:#d93025; }
.field-error-msg { font-size:12px; color:#d93025; margin:0; }
.checkbox-label { font-size:13px; color:#111111; cursor:pointer; }
.link { color:#111111; text-decoration:underline; font-size:13px; }
```

---

### Route B: `/dashboard` (Protected)

A grid-based monitoring dashboard with mock infrastructure health data. Match the Figma "Main Dashboard" frame **exactly** — do not add or omit any tile.

Build tiles using a local `MetricCardComponent`. Each card accepts: `title` (string), `value` (string), `trend` (string | null), `trendVariant` (`'success'|'warning'|'danger'|null`), `subLabel` (string | null). Optional `<ng-content>` slot for richer card bodies.

For trend badges, render `<span class="tag tag-{{trendVariant}}">{{ trend }}</span>` inside `MetricCardComponent`.

Cards (left-to-right, top-to-bottom as in Figma):

1. **Active Users** — value `1,284`, trend `+12%` (`tag-success`), sub-label `"vs last 7 days"`.
2. **Avg Response Time** — value `142ms`, trend `-8ms` (`tag-success`), sub-label `"vs last 7 days"`.
3. **Error Rate** — value `0.04%`, trend `+0.01%` (`tag-danger`), sub-label `"vs last 7 days"`.
4. **Uptime (30d)** — value `99.97%`, trend `Stable` (`tag-success`), sub-label `"last 30 days"`.
5. **Request Throughput** — a local `ThroughputChartComponent`. CSS-only 7-bar chart (no external libraries) with 7 bars (Mon–Sun). Bar fill: `background-color: #000000`.
6. **Service Health** — status rows using `<span class="tag tag-success">Online</span>` / `<span class="tag tag-danger">Offline</span>`. Services: `API Gateway` (Online), `Auth Service` (Online), `Storage Service` (Online), `Analytics Engine` (Offline), `Cache Layer` (Online).
7. **Data Summary** — `<ul class="data-list">` with `<li class="data-list-item">` rows. Items: Requests/min `4,820`, Avg Response `142 ms`, Error Rate `0.04%`, Uptime (30d) `99.97%`.
8. **System Logs** — local `LogsCardComponent`: scrollable, monospace terminal, auto-appends a new fake log line every 3 seconds.

**Tag CSS (global in `styles.css`):**

```css
.tag { display:inline-flex; align-items:center; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:500; white-space:nowrap; }
.tag-success { background:#f0fdf4; color:#16a34a; }
.tag-warning { background:#fefce8; color:#ca8a04; }
.tag-danger  { background:#fef2f2; color:#dc2626; }
.tag-info    { background:#eff6ff; color:#2563eb; }
.tag-default { background:#f5f5f5; color:#555555; }
```

**Data list CSS:**

```css
.data-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; }
.data-list-item { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f0f0f0; font-size:14px; }
.data-list-item:last-child { border-bottom:none; }
.data-list-item .item-label { color:#666666; }
.data-list-item .item-value { font-weight:600; color:#111111; }
```

---

### Route C: `/users` (Protected CRUD Page)

A full CRUD interface using a plain `<table>` element — no custom table component needed.

**Page header row (above the table):**
- Left: `<h1 class="page-title">Team Members</h1>`.
- Right: `<button class="btn btn-primary" type="button" (click)="inviteModalOpen = true">Invite Member</button>`.

**Table HTML (inline in `UsersComponent`):**

```html
<div class="table-wrapper">
  <table class="data-table">
    <thead>
      <tr>
        <th>Avatar</th>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
        <th>Status</th>
        <th>Joined</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let user of users">
        <td>
          <app-avatar [src]="user.avatar" [name]="user.name" size="sm" shape="circle"></app-avatar>
        </td>
        <td>{{ user.name }}</td>
        <td class="text-muted">{{ user.email }}</td>
        <td>
          <span class="tag" [ngClass]="'tag-' + roleTagClass(user.role)">{{ user.role }}</span>
        </td>
        <td>
          <span class="tag" [ngClass]="user.status === 'Active' ? 'tag-success' : 'tag-warning'">
            {{ user.status }}
          </span>
        </td>
        <td class="text-muted">{{ user.joinedDate }}</td>
        <td class="actions-cell">
          <button class="btn btn-ghost btn-sm" type="button" (click)="openDetails(user)">Details</button>
          <button class="btn btn-secondary btn-sm" type="button" (click)="openEdit(user)">Edit</button>
          <button class="btn btn-danger btn-sm" type="button" (click)="openDeleteConfirm(user)">Delete</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

**`roleTagClass` helper:**

```ts
roleTagClass(role: string): string {
  if (role === 'Admin') return 'success';
  if (role === 'Editor') return 'info';
  return 'default';
}
```

**Table CSS:**

```css
.page-title { font-size:20px; font-weight:600; color:#111111; margin:0; }
.table-wrapper { overflow-x:auto; border-radius:8px; border:1px solid #e5e5e5; }
.data-table { width:100%; border-collapse:collapse; font-size:14px; }
.data-table th { background:#fafafa; padding:10px 16px; text-align:left; font-size:12px; font-weight:600; color:#666666; text-transform:uppercase; letter-spacing:.03em; border-bottom:1px solid #e5e5e5; }
.data-table td { padding:12px 16px; border-bottom:1px solid #f0f0f0; color:#111111; vertical-align:middle; }
.data-table tr:last-child td { border-bottom:none; }
.data-table tr:hover td { background:#fafafa; }
.text-muted { color:#666666; }
.actions-cell { display:flex; gap:6px; align-items:center; }
```

---

#### CRUD Modals

All four modals use a locally built `AppModalComponent` (see Section 5 for its full implementation).

`AppModalComponent` content projection:
- `#modalHeader` — `@ContentChild('modalHeader') headerTpl?: TemplateRef<unknown>`. Rendered via `[ngTemplateOutlet]` when the `title` input is **not** provided. Use for custom headers (e.g., title + badge).
- Default `<ng-content>` — modal body.
- `[modal-footer]` — `<ng-content select="[modal-footer]">` — modal footer. The `.modal-footer` wrapper uses `display:flex; justify-content:flex-end; gap:8px`. For a split left/right footer, set `flex:1; display:flex; align-items:center; justify-content:space-between` on the projected element.

> ⚠️ **Event binding on native buttons:** Use `(click)` — **not** `(onClick)`. `(onClick)` is a custom output of `dsb-button` and does not exist on native elements.

---

##### Delete Confirmation Modal

```html
<app-modal [(open)]="deleteModalOpen" title="Confirm Deletion" size="sm" [closeOnBackdrop]="true">
  <p *ngIf="selectedUser">
    Are you sure you want to remove <strong>{{ selectedUser.name }}</strong>?
    This action cannot be undone.
  </p>
  <div modal-footer>
    <button class="btn btn-secondary" type="button" (click)="deleteModalOpen = false">Cancel</button>
    <button class="btn btn-danger" type="button" (click)="confirmDelete()">Delete</button>
  </div>
</app-modal>
```

On confirm: `DELETE /api/users/:id` then reload. After confirm: close modal, clear `selectedUser`.

---

##### Member Details Modal (read-only, Figma node `22:11492`)

> No `title` input — uses `#modalHeader` template for "Member Details" + "Read only" badge.

```html
<app-modal [(open)]="detailsModalOpen" size="md" [closeOnBackdrop]="true">

  <ng-template #modalHeader>
    <div class="details-modal-title">
      Member Details
      <span class="readonly-badge">Read only</span>
    </div>
  </ng-template>

  <div *ngIf="selectedUser" class="modal-content">
    <div class="modal-user-row">
      <div class="modal-avatar-circle">{{ getInitials(selectedUser.name) }}</div>
      <div class="modal-user-info">
        <span class="modal-user-name">{{ selectedUser.name }}</span>
        <span class="modal-user-since">Member since {{ formatJoinedMonth(selectedUser.joinedDate) }}</span>
      </div>
    </div>
    <div class="modal-form">
      <div class="modal-grid-row">
        <div class="modal-field-wrapper">
          <span class="modal-label muted">First name</span>
          <div class="modal-display-field readonly">{{ getFirstName(selectedUser.name) }}</div>
        </div>
        <div class="modal-field-wrapper">
          <span class="modal-label muted">Last name</span>
          <div class="modal-display-field readonly">{{ getLastName(selectedUser.name) }}</div>
        </div>
      </div>
      <div class="modal-field-wrapper">
        <span class="modal-label muted">Email address</span>
        <div class="modal-display-field readonly">{{ selectedUser.email }}</div>
      </div>
      <div class="modal-field-wrapper">
        <span class="modal-label muted">Role</span>
        <div class="modal-display-field readonly">{{ selectedUser.role }}</div>
      </div>
      <div class="modal-status-row">
        <span class="modal-label">Status</span>
        <span class="tag" [ngClass]="selectedUser.status === 'Active' ? 'tag-success' : 'tag-warning'">
          {{ selectedUser.status }}
        </span>
      </div>
    </div>
  </div>

  <div modal-footer class="modal-footer-split">
    <span class="modal-footer-note">To make changes, request Admin access.</span>
    <button class="btn btn-secondary" type="button" (click)="detailsModalOpen = false">Close</button>
  </div>
</app-modal>
```

---

##### Edit Member Modal (Figma node `22:11448`)

> Uses `title="Edit Member"` input. Form splits full name into `firstName` + `lastName`. Role uses a native `<select>`. Status is read-only. Footer has a "Delete user" outline-danger button on the left.

```html
<app-modal [(open)]="editModalOpen" title="Edit Member" size="md" [closeOnBackdrop]="true">

  <div *ngIf="selectedUser" class="modal-content">
    <div class="modal-user-row">
      <div class="modal-avatar-circle">{{ getInitials(selectedUser.name) }}</div>
      <div class="modal-user-info">
        <span class="modal-user-name">{{ selectedUser.name }}</span>
        <span class="modal-user-since">Member since {{ formatJoinedMonth(selectedUser.joinedDate) }}</span>
      </div>
    </div>
    <form [formGroup]="editForm" class="modal-form">
      <div class="modal-grid-row">
        <div class="modal-field-wrapper">
          <label class="modal-label">First name</label>
          <input class="modal-input" formControlName="firstName" placeholder="First name">
        </div>
        <div class="modal-field-wrapper">
          <label class="modal-label">Last name</label>
          <input class="modal-input" formControlName="lastName" placeholder="Last name">
        </div>
      </div>
      <div class="modal-field-wrapper">
        <label class="modal-label">Email address</label>
        <input class="modal-input" type="email" formControlName="email" placeholder="Email address">
      </div>
      <div class="modal-field-wrapper">
        <label class="modal-label">Role</label>
        <select class="modal-input modal-select" formControlName="role">
          <option value="Admin">Admin</option>
          <option value="Editor">Editor</option>
          <option value="Viewer">Viewer</option>
        </select>
      </div>
      <div class="modal-status-row">
        <span class="modal-label">Status</span>
        <span class="tag" [ngClass]="selectedUser.status === 'Active' ? 'tag-success' : 'tag-warning'">
          {{ selectedUser.status }}
        </span>
      </div>
    </form>
  </div>

  <div modal-footer class="modal-footer-split">
    <button class="btn-delete-outline" type="button" (click)="deleteFromEdit()">Delete user</button>
    <div class="modal-footer-right">
      <button class="btn btn-secondary" type="button" (click)="editModalOpen = false">Cancel</button>
      <button class="btn btn-primary" type="button" (click)="confirmEdit()">Save changes</button>
    </div>
  </div>
</app-modal>
```

**Form group:**

```ts
editForm = this.fb.group({
  firstName: ['', Validators.required],
  lastName:  ['', Validators.required],
  email:     ['', Validators.required],
  role:      ['', Validators.required]
});
```

**`openEdit()`** — split name: `const [firstName, ...rest] = user.name.split(' ')`.

**`confirmEdit()`** — combine: `` name: `${firstName} ${lastName}`.trim() ``, then `PUT /api/users/:id`, reload.

**`deleteFromEdit()`** — `this.editModalOpen = false; this.deleteModalOpen = true;` (selectedUser stays set).

---

##### Invite Member Modal

```html
<app-modal [(open)]="inviteModalOpen" title="Invite Member" size="md" [closeOnBackdrop]="true">
  <form [formGroup]="inviteForm" class="modal-form">
    <div class="modal-grid-row">
      <div class="modal-field-wrapper">
        <label class="modal-label">First name</label>
        <input class="modal-input" formControlName="firstName" placeholder="First name">
      </div>
      <div class="modal-field-wrapper">
        <label class="modal-label">Last name</label>
        <input class="modal-input" formControlName="lastName" placeholder="Last name">
      </div>
    </div>
    <div class="modal-field-wrapper">
      <label class="modal-label">Email address</label>
      <input class="modal-input" type="email" formControlName="email" placeholder="Email address">
    </div>
    <div class="modal-field-wrapper">
      <label class="modal-label">Role</label>
      <select class="modal-input modal-select" formControlName="role">
        <option value="">Select role…</option>
        <option value="Admin">Admin</option>
        <option value="Editor">Editor</option>
        <option value="Viewer">Viewer</option>
      </select>
    </div>
  </form>
  <div modal-footer>
    <button class="btn btn-secondary" type="button" (click)="inviteModalOpen = false">Cancel</button>
    <button class="btn btn-primary" type="button" (click)="confirmInvite()">Send Invite</button>
  </div>
</app-modal>
```

**`confirmInvite()`** — combine firstName + lastName → `name`, generate dicebear avatar URL, `status: 'Active'`, `joinedDate: today`, `POST /api/users`, reload, reset form.

---

#### Modal Shared CSS (in `UsersComponent` styles)

```css
/* Body layout */
.modal-content { display:flex; flex-direction:column; gap:16px; }
.modal-user-row { display:flex; align-items:center; gap:14px; }
.modal-avatar-circle {
  width:40px; height:40px; border-radius:50%; background:#e8e8e8;
  display:flex; align-items:center; justify-content:center;
  font-size:14px; font-weight:600; color:#555555; flex-shrink:0; line-height:1;
}
.modal-user-info { display:flex; flex-direction:column; gap:2px; }
.modal-user-name { font-size:15px; font-weight:600; color:#111111; line-height:1.3; }
.modal-user-since { font-size:12px; color:#888888; line-height:1.3; }

/* Form */
.modal-form { display:flex; flex-direction:column; gap:16px; }
.modal-grid-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.modal-field-wrapper { display:flex; flex-direction:column; gap:5px; }
.modal-label { font-size:12px; font-weight:500; color:#111111; line-height:1; }
.modal-label.muted { color:#999999; }
.modal-input {
  border:1px solid #d4d4d4; border-radius:6px; padding:8px 12px;
  font-size:13px; color:#111111; background:#ffffff;
  outline:none; width:100%; box-sizing:border-box; font-family:inherit; line-height:1.2;
}
.modal-input:focus { border-color:#999999; }
.modal-display-field {
  border:1px solid #d4d4d4; border-radius:6px; padding:8px 12px;
  font-size:13px; line-height:1.2;
}
.modal-display-field.readonly { background:#f5f5f5; color:#999999; }
.modal-select {
  appearance:none; -webkit-appearance:none; cursor:pointer;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 12px center; padding-right:32px;
}
.modal-status-row { display:flex; align-items:center; gap:8px; }

/* Footer layouts */
.modal-footer-split { flex:1; display:flex; align-items:center; justify-content:space-between; }
.modal-footer-right { display:flex; gap:8px; }
.modal-footer-note { font-size:12px; color:#888888; }

/* Details header */
.details-modal-title {
  display:flex; align-items:center; gap:8px;
  font-size:16px; font-weight:600; color:#111111; line-height:1.4;
}
.readonly-badge {
  display:inline-flex; align-items:center; padding:3px 8px;
  background:#f0f0f0; border-radius:4px; font-size:11px; font-weight:500; color:#555555;
}

/* Outline danger button (Edit modal footer) */
.btn-delete-outline {
  border:1px solid #f0a9a4; background:#ffffff; color:#d93025;
  border-radius:6px; padding:7px 14px; font-size:13px; font-weight:500;
  cursor:pointer; line-height:1; font-family:inherit;
}
.btn-delete-outline:hover { background:#fff5f4; }
```

---

#### Modal Helper Methods

```ts
getInitials(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

formatJoinedMonth(date?: string): string {
  if (!date) return '';
  const [year, month] = date.split('-');
  const months = ['January','February','March','April','May','June','July',
                  'August','September','October','November','December'];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

getFirstName(name?: string): string { return name ? name.split(' ')[0] : ''; }
getLastName(name?: string): string { return name ? name.split(' ').slice(1).join(' ') : ''; }
deleteFromEdit(): void { this.editModalOpen = false; this.deleteModalOpen = true; }
```

---

## 5. Shared Component Reference

All UI components are built locally in `src/app/shared/components/`. There is no external library providing Table, Modal, Avatar, Tag, Button, Input, or Header components.

---

### `AppModalComponent` (selector `app-modal`)

The critical reusable overlay component used by all 4 modals.

**TypeScript skeleton:**

```ts
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet],
  templateUrl: './app-modal.component.html',
  styleUrls: ['./app-modal.component.css']
})
export class AppModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() closeOnBackdrop = false;

  @Output() openChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  @ContentChild('modalHeader') headerTpl?: TemplateRef<unknown>;

  close() { this.open = false; this.openChange.emit(false); this.closed.emit(); }
  onOverlayClick() { if (this.closeOnBackdrop) this.close(); }
}
```

> Import `NgTemplateOutlet` from `@angular/common` in the `imports` array — it is needed for `[ngTemplateOutlet]`.

**Template:**

```html
@if (open) {
  <div class="modal-overlay" (click)="onOverlayClick()">
    <div class="modal-panel modal-panel-{{size}}" (click)="$event.stopPropagation()">
      <div class="modal-header">
        @if (title) {
          <h2 class="modal-title">{{ title }}</h2>
        } @else if (headerTpl) {
          <ng-container [ngTemplateOutlet]="headerTpl"></ng-container>
        }
        <button class="modal-close-btn" type="button" (click)="close()">✕</button>
      </div>
      <div class="modal-body">
        <ng-content></ng-content>
      </div>
      <div class="modal-footer">
        <ng-content select="[modal-footer]"></ng-content>
      </div>
    </div>
  </div>
}
```

**CSS:**

```css
.modal-overlay {
  position:fixed; inset:0; background:rgba(0,0,0,.4);
  display:flex; align-items:center; justify-content:center; z-index:200;
}
.modal-panel {
  background:#ffffff; border-radius:10px; box-shadow:0 8px 32px rgba(0,0,0,.14);
  display:flex; flex-direction:column; max-height:90vh; width:100%;
  margin:16px;
}
.modal-panel-sm { max-width:400px; }
.modal-panel-md { max-width:560px; }
.modal-panel-lg { max-width:720px; }
.modal-header {
  display:flex; align-items:center; justify-content:space-between;
  padding:16px 20px; border-bottom:1px solid #f0f0f0; flex-shrink:0;
}
.modal-title { font-size:16px; font-weight:600; color:#111111; margin:0; }
.modal-close-btn {
  border:none; background:none; font-size:16px; color:#999999;
  cursor:pointer; padding:4px; border-radius:4px; line-height:1;
}
.modal-close-btn:hover { background:#f5f5f5; color:#111111; }
.modal-body { padding:16px 20px; flex:1; overflow-y:auto; }
.modal-footer {
  padding:12px 20px; border-top:1px solid #f0f0f0;
  display:flex; justify-content:flex-end; gap:8px;
  align-items:center; flex-shrink:0;
}
```

---

### `AppAvatarComponent` (selector `app-avatar`)

**Inputs:** `src: string`, `name: string`, `size: 'sm'|'md'|'lg'` (default `'md'`), `shape: 'circle'|'rounded'|'square'` (default `'circle'`).

**Template:**

```html
<div class="avatar" [ngClass]="['avatar-'+size, 'avatar-'+shape]">
  @if (src && !imgFailed) {
    <img [src]="src" [alt]="name" class="avatar-img" (error)="imgFailed = true" />
  } @else {
    <span class="avatar-initials">{{ initials }}</span>
  }
</div>
```

**TypeScript:**

```ts
imgFailed = false;
get initials(): string {
  if (!this.name) return '?';
  const p = this.name.trim().split(' ').filter(Boolean);
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : p[0].substring(0, 2).toUpperCase();
}
```

**CSS:**

```css
.avatar { display:inline-flex; align-items:center; justify-content:center; overflow:hidden; background:#e8e8e8; font-weight:600; flex-shrink:0; }
.avatar-sm  { width:28px; height:28px; font-size:11px; }
.avatar-md  { width:36px; height:36px; font-size:13px; }
.avatar-lg  { width:48px; height:48px; font-size:16px; }
.avatar-circle  { border-radius:50%; }
.avatar-rounded { border-radius:6px; }
.avatar-square  { border-radius:2px; }
.avatar-img { width:100%; height:100%; object-fit:cover; }
.avatar-initials { color:#555555; line-height:1; text-transform:uppercase; }
```

---

### Button CSS Classes (global in `styles.css`)

Do **not** create a `ButtonComponent`. Use `<button>` or `<a>` elements directly with these classes.

```css
.btn {
  display:inline-flex; align-items:center; justify-content:center; gap:6px;
  border:none; border-radius:6px; padding:8px 16px;
  font-size:13px; font-weight:500; cursor:pointer; font-family:inherit;
  line-height:1; transition:background .15s, opacity .15s; white-space:nowrap;
}
.btn:disabled { opacity:.5; cursor:not-allowed; }
.btn-sm   { padding:6px 12px; font-size:12px; }
.btn-lg   { padding:10px 20px; font-size:15px; }
.btn-full { width:100%; }

.btn-primary   { background:#111111; color:#ffffff; border:none; }
.btn-primary:hover { background:#333333; }

.btn-secondary { background:#ffffff; color:#111111; border:1px solid #d4d4d4; }
.btn-secondary:hover { background:#f5f5f5; }

.btn-ghost { background:transparent; color:#111111; border:none; }
.btn-ghost:hover { background:#f5f5f5; }

.btn-danger { background:#d93025; color:#ffffff; border:none; }
.btn-danger:hover { background:#b5271f; }
```

---

### Remaining Local Components

| Component | Purpose |
|---|---|
| `AuthCardComponent` | Centered card shell for the login page |
| `MainLayoutComponent` | Authenticated app shell (header + router-outlet + footer) |
| `AppHeaderComponent` | Application header: brand + nav + right `<ng-content>` slot |
| `AppFooterComponent` | Footer with `FooterColumn[]` columns and copyright |
| `UserProfileMenuComponent` | Profile area: `AppAvatarComponent` + name + custom CSS dropdown |
| `MetricCardComponent` | Dashboard metric tile (value, trend badge, sub-label, content slot) |
| `ThroughputChartComponent` | CSS-only 7-bar chart. Bar fill: `#000000`. No external libraries. |
| `LogsCardComponent` | Scrollable monospace log viewer with `setInterval` auto-append |

---

## 6. Design Values

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

## 7. Mock Data Schema (`InMemoryDbService`)

Define an in-memory collection named `users` seeded with at least 5 records:

```json
[
  { "id": 1, "name": "Jane Doe",      "email": "jane.doe@example.com",      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",    "role": "Admin",  "status": "Active",   "joinedDate": "2024-01-15" },
  { "id": 2, "name": "John Smith",    "email": "john.smith@example.com",    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=John",    "role": "Editor", "status": "Active",   "joinedDate": "2024-02-20" },
  { "id": 3, "name": "Alice Johnson", "email": "alice.johnson@example.com", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",   "role": "Viewer", "status": "Active",   "joinedDate": "2024-03-10" },
  { "id": 4, "name": "Bob Martinez",  "email": "bob.martinez@example.com",  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",     "role": "Editor", "status": "Inactive", "joinedDate": "2024-04-05" },
  { "id": 5, "name": "Carol White",   "email": "carol.white@example.com",   "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",   "role": "Viewer", "status": "Active",   "joinedDate": "2024-05-18" }
]
```

Valid `role` values: `"Admin"`, `"Editor"`, `"Viewer"`.
Valid `status` values: `"Active"`, `"Inactive"`.

Configure in `app.config.ts`:

```ts
importProvidersFrom(HttpClientInMemoryWebApiModule.forRoot(AppInMemoryDataService, {
  dataEncapsulation: false,
  delay: 300,
  passThruUnknownUrl: true
}))
```

---

## 8. Expected Deliverables

1. **`app.config.ts`** — `provideRouter(routes)`, `provideHttpClient(withInterceptorsFromDi())`, `importProvidersFrom(HttpClientInMemoryWebApiModule.forRoot(...))`.
2. **`app.component.html`** — `<router-outlet />` only.
3. **`app.routes.ts`** — `''` → redirect `/login`; `/login` with `loginGuard`; layout wrapper with `authGuard` → children `/dashboard`, `/users`; `'**'` → `/login`.
4. **`AuthService`** — wraps `localStorage` for `isLoggedIn`. Methods: `isLoggedIn()`, `login(u, p)` (checks `admin`/`admin`), `logout()`.
5. **`AppInMemoryDataService implements InMemoryDbService`** — `createDb()` returns `{ users: [...] }` with data from Section 7.
6. **`UsersService`** — `getAll()`, `getById(id)`, `update(id, user)`, `create(user)`, `delete(id)` covering all five HTTP operations.
7. **`styles.css`** — `:root` design values (Section 6); global reset; `.btn.*` button classes; `.tag.*` badge classes; `.data-list` classes.
8. **All shared components** from Section 5: `AppModalComponent`, `AppAvatarComponent`, `AuthCardComponent`, `MainLayoutComponent`, `AppHeaderComponent`, `AppFooterComponent`, `UserProfileMenuComponent`, `MetricCardComponent`, `ThroughputChartComponent`, `LogsCardComponent`.
9. **`LoginComponent`** — full reactive form matching Figma; `.has-error` / `.field-error-msg` error handling.
10. **`DashboardComponent`** — 8 tiles matching Figma, using `.tag.*` spans instead of any tag component.
11. **`UsersComponent`** — plain `<table>` with 7 columns + 4 modals (Delete, Details, Edit, Invite) using `<app-modal>`.

---

## 9. Critical Implementation Gotchas

These behaviours must be followed exactly to avoid rework.

### 9.1 No External Component Library
Do **not** import from `@jablonowski/dsb-components` or `@jablonowski/dsb-tokens`. All UI is native HTML elements + CSS from Section 5 and 6. Do not run `npm install` for those packages.

### 9.2 Native Button Event: `(click)` Not `(onClick)`
Native `<button>` elements emit the standard DOM `(click)` event. `(onClick)` is a custom `@Output()` defined on `dsb-button` (the DS component) and does not exist on native elements. Always use `(click)`.

### 9.3 `AppModalComponent` — `@ContentChild('modalHeader')` for Custom Header
For a custom modal header (e.g., title + badge in the Details modal), pass an `<ng-template #modalHeader>` as a child of `<app-modal>`. The component queries it with `@ContentChild('modalHeader') headerTpl?: TemplateRef<unknown>` and renders it via `[ngTemplateOutlet]`. Import `NgTemplateOutlet` from `@angular/common` in `AppModalComponent`'s `imports` array — it is required for the `[ngTemplateOutlet]` directive to work.

### 9.4 `AppModalComponent` Footer — Split Layout Needs `flex:1`
The `.modal-footer` wrapper uses `display:flex; justify-content:flex-end; gap:8px`. For a split left/right footer (Edit modal: Delete-user left, Cancel+Save right), project a single `<div modal-footer class="modal-footer-split">` element. The `modal-footer-split` class sets `flex:1; display:flex; align-items:center; justify-content:space-between` so it fills the full footer width.

### 9.5 `UserProfileMenuComponent` — Custom Dropdown, Right-Edge Safe
Always use `right:0; left:auto` on `.menu-panel`. This ensures the dropdown opens leftward from the trigger and is never clipped at the right viewport edge. Use `@HostListener('document:click')` + a `contains()` check to close on outside click.

### 9.6 `ThroughputChartComponent` — Bar Fill Colour
Use `background-color: #000000` directly on the bar `<div>` elements (inline style or a direct CSS class). Do not use a CSS variable for this value.

### 9.7 Angular 19 — Prefer `@if` / `@for` Control Flow (No Imports Required)
The new built-in control flow syntax (`@if`, `@for`, `@switch`) is available in Angular 17+ with no imports. It avoids the need to import `NgIf`, `NgFor`, or `CommonModule` in standalone component `imports` arrays. Use it by default across all components. Only import `NgIf`/`NgFor` if you intentionally use the legacy `*ngIf`/`*ngFor` directive syntax.

### 9.8 `AppAvatarComponent` — Handle Image Load Failures
Always include `(error)="imgFailed = true"` on the `<img>` so the initials circle is shown as a fallback when the avatar URL fails to load (dicebear SVGs may fail on slow or offline connections).

### 9.9 `AppModalComponent` — `@if` Inside Template vs `*ngIf` on `<ng-content>`
Do **not** use `*ngIf` directly on `<ng-content>` elements — Angular always instantiates projected content regardless of `*ngIf` on the `<ng-content>` tag. The recommended pattern (used in `AppModalComponent`) is: keep `<ng-content>` unconditional for body and footer slots; use `@ContentChild` + `[ngTemplateOutlet]` for the conditional header slot.
