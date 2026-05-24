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
- **Modal nodes:** `22:11448` (modal-edit), `22:11492` (modal-details) — reference for exact modal body layout, spacing, and colours.

### Instructions for the AI Assistant

1. **Fetch Layouts:** Connect to the Figma MCP server using the file token above. Locate the frames at node `22-11104` containing the "Auth Layout" and "Main Dashboard/CRUD Layout".
2. **Visual Truth:** Treat the dimensions, structural positioning, responsive grids, and spacing from Figma as the absolute visual truth for layout assembly.
3. **Audit Missing Components:** Compare the required layouts against the available components in `@jablonowski/dsb-components` (see Section 5) to identify structural pieces that must be built locally.
4. **Read Section 9 first** — it lists verified component behaviours and critical gotchas discovered from real implementation that override any assumptions.

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

- **Header:** Use `dsb-header` from `@jablonowski/dsb-components`. Pass `brandName`, `logoSrc`, `logoHref`, and `navItems`.

  > ⚠️ **`dsb-header` has NO content projection slots** (`ngContentSelectors: never`). You cannot project anything into it. `UserProfileMenuComponent` must be placed **adjacent** to `<dsb-header>` in the layout shell HTML using CSS positioning — not inside or projected into the header.

  Place the layout header row as a `position: relative` flex container:
  ```html
  <div class="layout-header-row">
    <dsb-header [brandName]="..." [navItems]="..." />
    <app-user-profile-menu style="position:absolute; right:24px; top:50%; transform:translateY(-50%)"
      (signOut)="onSignOut()" />
  </div>
  ```

  **`UserProfileMenuComponent`** must show `<dsb-avatar>` + name label + dropdown trigger. It must be **always visible** in the header top-right area when authenticated. It emits a `(signOut)` output that the layout handles.

  > ⚠️ **Do NOT use `dsb-dropdown` inside `UserProfileMenuComponent`**. The `dsb-dropdown` panel uses `position:absolute; left:0; right:0` (panel width = trigger width, anchored to trigger left edge). When the trigger is at the far right of the viewport the panel content is clipped. Instead, implement a **custom CSS dropdown**: a host-relative `position:relative` wrapper, a toggle boolean, `@HostListener('document:click')` to close on outside click, and a `.menu-panel` absolutely positioned with `right:0; left:auto` so it opens leftward.

  ```ts
  // UserProfileMenuComponent skeleton
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (!this.el.nativeElement.contains(e.target)) this.isOpen = false;
  }
  toggleMenu(e: MouseEvent) { e.stopPropagation(); this.isOpen = !this.isOpen; }
  ```

  ```html
  <div class="profile-trigger" (click)="toggleMenu($event)">
    <dsb-avatar [src]="avatarUrl" name="Admin User" size="sm" shape="circle" />
    <span>Admin User</span>
    <span class="chevron">▾</span>
  </div>
  <div class="menu-panel" *ngIf="isOpen">
    <button (click)="onMyProfile()">My Profile</button>
    <button (click)="onSignOut()">Sign Out</button>
  </div>
  ```

  ```css
  :host { position: relative; display: flex; align-items: center; }
  .menu-panel { position: absolute; top: calc(100% + 8px); right: 0; left: auto;
    background: #fff; border: 1px solid #e5e5e5; border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,.10); min-width: 160px; z-index: 100; }
  ```

- **Footer:** Use `dsb-footer` from `@jablonowski/dsb-components`. Pass `brandName`, `copyright`, `columns`, and `legalLinks`.

  > ⚠️ **`FooterColumn` interface uses `heading`, not `title`**:
  > ```ts
  > columns: FooterColumn[] = [{ heading: 'Product', links: [...] }]
  > ```

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

1. **Active Users** — value `1,284`, trend badge `dsb-tag` (`variant="success"`, label `+12%`), sub-label `"vs last 7 days"`.
2. **Avg Response Time** — value `142ms`, trend badge `dsb-tag` (`variant="success"`, label `-8ms`), sub-label `"vs last 7 days"`.
3. **Error Rate** — value `0.04%`, trend badge `dsb-tag` (`variant="danger"`, label `+0.01%`), sub-label `"vs last 7 days"`.
4. **Uptime (30d)** — value `99.97%`, trend badge `dsb-tag` (`variant="success"`, label `Stable`), sub-label `"last 30 days"`.
5. **Request Throughput** — a local `ThroughputChartComponent`. CSS-only bar chart (no external libraries) with 7 bars (Mon–Sun). Each bar `<div>` has `height` as a percentage of the max value. Bar fill: `background-color: #000000`. Title: `"Request Throughput"`, x-axis: day labels.
6. **Service Health** — status rows using `dsb-tag` (`variant="success"` for Online, `variant="danger"` for Offline). Services: `API Gateway` (Online), `Auth Service` (Online), `Storage Service` (Online), `Analytics Engine` (Offline), `Cache Layer` (Online).
7. **Data Summary** — `dsb-list` + `dsb-list-item` showing: Requests/min `4,820`, Avg Response `142 ms`, Error Rate `0.04%`, Uptime (30d) `99.97%`.
8. **System Logs** — local `LogsCardComponent`: scrollable, monospace terminal, auto-appends a new fake log line every 3 seconds.

### Route C: `/users` (Protected CRUD Page)

A full CRUD interface using `dsb-table`.

**Page header row (above the table):**
- Left: page heading `"Team Members"` (`h1`, semibold).
- Right: `dsb-button` (`variant="primary"`, label `"Invite Member"`) — wire to open the Invite modal (`inviteModalOpen = true`).

**Table Columns (in this order):**

| Column | `key` | Rendered via |
|---|---|---|
| Avatar | `avatar` | `<ng-template #cell let-row="row">` — render `<dsb-avatar [src]="row['avatar']" [name]="row['name']" size="sm" shape="circle" />` |
| Name | `name` | Default text cell |
| Email | `email` | Default text cell |
| Role | `role` | `<ng-template #cell let-row="row">` — render `<dsb-tag [variant]="roleVariant(row['role'])" size="sm">{{ row['role'] }}</dsb-tag>` |
| Status | `status` | `<ng-template #cell let-row="row">` — render `<dsb-tag [variant]="row['status'] === 'Active' ? 'success' : 'warning'" size="sm">{{ row['status'] }}</dsb-tag>` |
| Joined | `joinedDate` | Default text cell |
| Actions | — | `<ng-template #cell let-row="row">` — render three `dsb-button`: `variant="ghost"` `"Details"`, `variant="secondary"` `"Edit"`, `variant="danger"` `"Delete"`, each wired to the corresponding method |

> **Critical — `ng-template` inside `dsb-column`:**
> `ColumnDefDirective` uses `@ContentChild('cell')` to find the template. You **must** use `#cell` as the template reference and `let-row="row"` to get the full row object. `let-row` without `="row"` binds to `$implicit` (the single cell value), not the full row.
>
> ```html
> <!-- ✅ CORRECT -->
> <dsb-column key="role" header="Role">
>   <ng-template #cell let-row="row">
>     <dsb-tag [variant]="roleVariant(row['role'])" size="sm">{{ row['role'] }}</dsb-tag>
>   </ng-template>
> </dsb-column>
>
> <!-- ❌ WRONG — #cell missing; let-row binds to $implicit (cell value), not full row -->
> <dsb-column key="role" header="Role">
>   <ng-template let-row>
>     <dsb-tag>{{ row['role'] }}</dsb-tag>  <!-- undefined! -->
>   </ng-template>
> </dsb-column>
> ```

**`roleVariant` helper:**
```ts
roleVariant(role: string): 'success' | 'info' | 'default' {
  if (role === 'Admin') return 'success';
  if (role === 'Editor') return 'info';
  return 'default';
}
```

---

#### CRUD Modals

All four modals use `dsb-modal`. Content projection slots:
- **`[modal-title]`** — rendered in the header area **only** when the `title` input is NOT provided (`*ngIf="!title"` in dsb-modal template). Use this for custom header content (e.g., title + badge). If `title` input is provided, this slot is ignored.
- **`*`** (default slot) — modal body content.
- **`[modal-footer]`** — footer content. The `.modal-footer` wrapper uses `display:flex; justify-content:flex-end; gap:8px`. For a split left/right footer, add `flex:1; display:flex; align-items:center; justify-content:space-between` on the projected element.

---

##### Delete Confirmation Modal

```html
<dsb-modal [(open)]="deleteModalOpen" title="Confirm Deletion" size="sm" [closeOnBackdrop]="true">
  <p *ngIf="selectedUser">
    Are you sure you want to remove <strong>{{ selectedUser.name }}</strong>?
    This action cannot be undone.
  </p>
  <div modal-footer>
    <dsb-button variant="secondary" (onClick)="deleteModalOpen = false">Cancel</dsb-button>
    <dsb-button variant="danger" (onClick)="confirmDelete()">Delete</dsb-button>
  </div>
</dsb-modal>
```

On confirm: `DELETE /api/users/:id` then reload. After confirm: close modal, clear `selectedUser`.

---

##### Member Details Modal (read-only, Figma node `22:11492`)

> No `title` input — uses `[modal-title]` slot for "Member Details" + "Read only" badge.

```html
<dsb-modal [(open)]="detailsModalOpen" size="md" [closeOnBackdrop]="true">

  <!-- Custom header: title + "Read only" badge -->
  <div modal-title class="details-modal-title">
    Member Details
    <span class="readonly-badge">Read only</span>
  </div>

  <!-- Body -->
  <div *ngIf="selectedUser" class="modal-content">
    <!-- User row: avatar circle + name + "Member since [Month YYYY]" -->
    <div class="modal-user-row">
      <div class="modal-avatar-circle">{{ getInitials(selectedUser.name) }}</div>
      <div class="modal-user-info">
        <span class="modal-user-name">{{ selectedUser.name }}</span>
        <span class="modal-user-since">Member since {{ formatJoinedMonth(selectedUser.joinedDate) }}</span>
      </div>
    </div>
    <!-- Read-only fields -->
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
        <dsb-tag [variant]="selectedUser.status === 'Active' ? 'success' : 'warning'" size="sm">
          {{ selectedUser.status }}
        </dsb-tag>
      </div>
    </div>
  </div>

  <!-- Footer: hint text (left) + Close (right) -->
  <div modal-footer class="modal-footer-split">
    <span class="modal-footer-note">To make changes, request Admin access.</span>
    <dsb-button variant="secondary" (onClick)="detailsModalOpen = false">Close</dsb-button>
  </div>
</dsb-modal>
```

---

##### Edit Member Modal (Figma node `22:11448`)

> Uses `title="Edit Member"` input. Form fields split full name into `firstName` + `lastName`. Role uses a native `<select>` (not `dsb-dropdown`) for reliable full-width styling. Status is displayed as a read-only tag, not editable. Footer has a "Delete user" outline-danger button on the left.

```html
<dsb-modal [(open)]="editModalOpen" title="Edit Member" size="md" [closeOnBackdrop]="true">

  <div *ngIf="selectedUser" class="modal-content">
    <!-- User row -->
    <div class="modal-user-row">
      <div class="modal-avatar-circle">{{ getInitials(selectedUser.name) }}</div>
      <div class="modal-user-info">
        <span class="modal-user-name">{{ selectedUser.name }}</span>
        <span class="modal-user-since">Member since {{ formatJoinedMonth(selectedUser.joinedDate) }}</span>
      </div>
    </div>
    <!-- Editable form -->
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
        <dsb-tag [variant]="selectedUser.status === 'Active' ? 'success' : 'warning'" size="sm">
          {{ selectedUser.status }}
        </dsb-tag>
      </div>
    </form>
  </div>

  <!-- Footer: Delete user (left) + Cancel + Save changes (right) -->
  <div modal-footer class="modal-footer-split">
    <button class="btn-delete-outline" type="button" (click)="deleteFromEdit()">Delete user</button>
    <div class="modal-footer-right">
      <dsb-button variant="secondary" (onClick)="editModalOpen = false">Cancel</dsb-button>
      <dsb-button variant="primary" (onClick)="confirmEdit()">Save changes</dsb-button>
    </div>
  </div>
</dsb-modal>
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

**`confirmEdit()`** — combine: `name: \`${firstName} ${lastName}\`.trim()`, then `PUT /api/users/:id`, reload.

**`deleteFromEdit()`** — `this.editModalOpen = false; this.deleteModalOpen = true;` (selectedUser stays set).

---

##### Invite Member Modal

```html
<dsb-modal [(open)]="inviteModalOpen" title="Invite Member" size="md" [closeOnBackdrop]="true">
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
    <dsb-button variant="secondary" (onClick)="inviteModalOpen = false">Cancel</dsb-button>
    <dsb-button variant="primary" (onClick)="confirmInvite()">Send Invite</dsb-button>
  </div>
</dsb-modal>
```

**`confirmInvite()`** — combine firstName + lastName → `name`, generate dicebear avatar URL, `status: 'Active'`, `joinedDate: today`, `POST /api/users`, reload, reset form.

---

#### Modal Shared CSS (component styles)

```css
/* User row */
.modal-content { display: flex; flex-direction: column; gap: 16px; }
.modal-user-row { display: flex; align-items: center; gap: 14px; }
.modal-avatar-circle {
  width: 40px; height: 40px; border-radius: 50%; background: #e8e8e8;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 600; color: #555555; flex-shrink: 0; line-height: 1;
}
.modal-user-info { display: flex; flex-direction: column; gap: 2px; }
.modal-user-name { font-size: 15px; font-weight: 600; color: #111111; line-height: 1.3; }
.modal-user-since { font-size: 12px; color: #888888; line-height: 1.3; }

/* Form */
.modal-form { display: flex; flex-direction: column; gap: 16px; }
.modal-grid-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.modal-field-wrapper { display: flex; flex-direction: column; gap: 5px; }
.modal-label { font-size: 12px; font-weight: 500; color: #111111; line-height: 1; }
.modal-label.muted { color: #999999; }
.modal-input {
  border: 1px solid #d4d4d4; border-radius: 6px; padding: 8px 12px;
  font-size: 13px; color: #111111; background: #ffffff;
  outline: none; width: 100%; box-sizing: border-box; font-family: inherit; line-height: 1.2;
}
.modal-input:focus { border-color: #999999; }
.modal-display-field {
  border: 1px solid #d4d4d4; border-radius: 6px; padding: 8px 12px;
  font-size: 13px; line-height: 1.2;
}
.modal-display-field.readonly { background: #f5f5f5; color: #999999; }
.modal-select {
  appearance: none; -webkit-appearance: none; cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px;
}
.modal-status-row { display: flex; align-items: center; gap: 8px; }

/* Footer layouts */
.modal-footer-split { flex: 1; display: flex; align-items: center; justify-content: space-between; }
.modal-footer-right { display: flex; gap: 8px; }
.modal-footer-note { font-size: 12px; color: #888888; }

/* Details header */
.details-modal-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px; font-weight: 600; color: #111111; line-height: 1.4;
}
.readonly-badge {
  display: inline-flex; align-items: center; padding: 3px 8px;
  background: #f0f0f0; border-radius: 4px; font-size: 11px; font-weight: 500; color: #555555;
}

/* Outline danger button (Edit modal footer) */
.btn-delete-outline {
  border: 1px solid #f0a9a4; background: #ffffff; color: #d93025;
  border-radius: 6px; padding: 7px 14px; font-size: 13px; font-weight: 500;
  cursor: pointer; line-height: 1; font-family: inherit;
}
.btn-delete-outline:hover { background: #fff5f4; }
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

getFirstName(name?: string): string {
  return name ? name.split(' ')[0] : '';
}

getLastName(name?: string): string {
  return name ? name.split(' ').slice(1).join(' ') : '';
}
```

---

## 5. Component Reference

### Available in `@jablonowski/dsb-components`

> ⚠️ **CRITICAL — Import names have NO `Dsb` prefix.** The library exports plain class names:
> ```ts
> // ✅ CORRECT
> import { ButtonComponent, InputComponent, TableComponent, ColumnDefDirective,
>          TagComponent, AvatarComponent, ModalComponent, DropdownComponent,
>          CheckboxComponent, ListComponent, ListItemComponent,
>          HeaderComponent, FooterComponent } from '@jablonowski/dsb-components';
>
> // ❌ WRONG — DsbButtonComponent, DsbInputComponent, etc. do NOT exist
> ```

All components are **standalone**. Import them directly into the component's `imports` array.

| Selector | Class Name | Key `@Input()` | Key `@Output()` |
|---|---|---|---|
| `dsb-button` | `ButtonComponent` | `variant: 'primary'\|'secondary'\|'ghost'\|'danger'`, `size: 'sm'\|'md'\|'lg'`, `disabled`, `loading`, `fullWidth`, `type: 'button'\|'submit'\|'reset'` | `onClick` |
| `dsb-input` | `InputComponent` | `label`, `type`, `placeholder`, `size`, `hasError`, `errorMessage`, `hint`, `disabled` | `valueChange` |
| `dsb-checkbox` | `CheckboxComponent` | `label`, `checked`, `disabled`, `hasError`, `errorMessage`, `hint` | `checkedChange` |
| `dsb-radio-group` | `RadioGroupComponent` | `options: RadioOption[]`, `legend`, `disabled`, `hasError`, `errorMessage`, `inline` | `valueChange` |
| `dsb-dropdown` | `DropdownComponent` | `options: DropdownOption[]`, `label`, `placeholder`, `size`, `disabled`, `hasError`, `errorMessage` | `valueChange` |
| `dsb-header` | `HeaderComponent` | `brandName`, `logoSrc`, `logoAlt`, `logoHref`, `navItems: NavItem[]`, `ctaLabel`, `ctaHref` | — |
| `dsb-footer` | `FooterComponent` | `brandName`, `logoSrc`, `logoHref`, `tagline`, `columns: FooterColumn[]`, `copyright`, `legalLinks: FooterLink[]` | — |
| `dsb-tag` | `TagComponent` | `variant: 'default'\|'success'\|'warning'\|'danger'\|'info'`, `size: 'sm'\|'md'` | — |
| `dsb-avatar` | `AvatarComponent` | `src`, `alt`, `name` (initials fallback), `size: 'sm'\|'md'\|'lg'`, `shape: 'circle'\|'rounded'\|'square'` | — |
| `dsb-modal` | `ModalComponent` | `open`, `title`, `size: 'sm'\|'md'\|'lg'`, `closeOnBackdrop` | `openChange`, `closed` |
| `dsb-table` | `TableComponent` | `rows: Record<string, unknown>[]`, `striped`, `hoverable`, `loading`, `rowClickable`, `emptyMessage` | `rowClick` |
| `dsb-column` | `ColumnDefDirective` | `key` (required), `header`, `width`, `align: 'left'\|'center'\|'right'` | — |
| `dsb-list` | `ListComponent` | `divided`, `bordered`, `compact` | — |
| `dsb-list-item` | `ListItemComponent` | `label`, `description`, `meta`, `variant`, `indicator` | — |

**Key API notes:**

- **`dsb-footer` / `FooterColumn`**: The interface field is **`heading`**, not `title`:
  ```ts
  columns: FooterColumn[] = [{ heading: 'Product', links: [{ label: 'Dashboard', href: '/dashboard' }] }]
  ```

- **`dsb-modal` content projection** (`ngContentSelectors: ["[modal-title]", "*", "[modal-footer]"]`):
  - `[modal-title]` — appears in the modal header. **Only rendered when `title` input is NOT passed** (conditional `*ngIf="!title"`). Omit `title` input when using this slot.
  - `*` — modal body (has `padding: 16px 20px` built-in).
  - `[modal-footer]` — modal footer (`display:flex; justify-content:flex-end; gap:8px` built-in). For a split layout, set `flex:1` on the projected element.

- **`dsb-header`** — `ngContentSelectors: never`. No slots. Place adjacent sibling components using CSS (see Section 3).

- **`dsb-dropdown` panel** — `position:absolute; left:0; right:0` (panel width = trigger width). Clips when trigger is at the right viewport edge. Do not use for profile menus positioned at the far right. Use a custom CSS dropdown instead.

- **`dsb-column` / `ColumnDefDirective`** — uses `@ContentChild('cell')` internally. Template context: `{ $implicit: row[col.key], row: row, index: i }`. **Always use `#cell` reference and `let-row="row"`** (not bare `let-row`):
  ```html
  <dsb-column key="role" header="Role">
    <ng-template #cell let-row="row">
      <dsb-tag [variant]="roleVariant(row['role'])" size="sm">{{ row['role'] }}</dsb-tag>
    </ng-template>
  </dsb-column>
  ```

### NOT Available — Build Locally in `src/app/shared/components/`

| Component | Purpose |
|---|---|
| `AuthCardComponent` | Centered card shell for the login page |
| `MainLayoutComponent` | Authenticated app shell (header + router-outlet + footer) |
| `UserProfileMenuComponent` | Header profile area: `dsb-avatar` + name + custom CSS dropdown |
| `MetricCardComponent` | Dashboard metric tile (value, sub-label, optional trend badge, content slot) |
| `ThroughputChartComponent` | CSS-only 7-bar chart (no charting libraries). Bar fill: `#000000` |
| `LogsCardComponent` | Scrollable monospace terminal log viewer with `setInterval` auto-append |

> There is **no** `Card`, `Badge`, `FormField`, or `Typography` component in the design system. For role/status badges use `dsb-tag`. For form field wrappers, compose `dsb-input` / native `<input>` directly.

---

## 6. Design Tokens (`@jablonowski/dsb-tokens`)

The package outputs CSS custom properties. CSS file: `dist/css/variables.css`.

**Global import in `styles.css`:**
```css
@import '@jablonowski/dsb-tokens/dist/css/variables.css';
```

**Token naming:** `--ds-{tier}-{category}-{name}`

Key decision-tier tokens for local components:

| Token | Purpose |
|---|---|
| `--ds-decisions-color-text-primary` | Primary body/label text |
| `--ds-decisions-color-text-secondary` | De-emphasised text |
| `--ds-decisions-color-text-placeholder` | Placeholder / empty state text |
| `--ds-decisions-color-surface-base` | Default card / control background |
| `--ds-decisions-color-surface-subtle` | Recessed surfaces (table header, etc.) |
| `--ds-decisions-color-border-subtle` | Layout dividers |
| `--ds-decisions-font-size-md` | Default body text (14 px) |
| `--ds-decisions-font-size-xl` | Section headings (16 px) |
| `--ds-decisions-font-size-2xl` | Large headings (login page title) |
| `--ds-decisions-font-weight-semibold` | Headings, modal titles |
| `--ds-decisions-shadow-modal` | Modal elevation |
| `--ds-decisions-motion-duration-base` | Standard transition duration |
| `--ds-decisions-motion-easing-standard` | Standard easing |

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
3. **`app.routes.ts`** — `''` → redirect `/login`; `/login` with `loginGuard` lazy-loads `LoginComponent`; layout wrapper with `authGuard` lazy-loads `MainLayoutComponent` with children `/dashboard` and `/users`; `'**'` → `/login`.
4. **`AuthService`** — wraps `localStorage` for `isLoggedIn`. Methods: `isLoggedIn()`, `login(u, p)` (checks `admin`/`admin`), `logout()`.
5. **`AppInMemoryDataService implements InMemoryDbService`** — `createDb()` returns `{ users: [...] }` with data from Section 7.
6. **`UsersService`** — `getAll()`, `getById(id)`, `update(id, user)`, `create(user)`, `delete(id)` covering all five HTTP operations.
7. **All local shared components** listed in Section 5.
8. **`LoginComponent`** — full reactive form matching Figma.
9. **`DashboardComponent`** — 8 tiles matching Figma.
10. **`UsersComponent`** — table with 7 columns + 4 modals (Delete, Details, Edit, Invite) with layouts from Section 4.

---

## 9. Critical Implementation Gotchas

These behaviours were verified against the actual library and must be followed exactly to avoid rework.

### 9.1 Import Names — No `Dsb` Prefix
All exported class names are plain: `ButtonComponent`, `InputComponent`, `TableComponent`, `ColumnDefDirective`, `TagComponent`, `AvatarComponent`, `ModalComponent`, `CheckboxComponent`, `DropdownComponent`, `HeaderComponent`, `FooterComponent`, `ListComponent`, `ListItemComponent`. There are **no** `DsbXxx` exports.

### 9.2 `dsb-column` Template — `#cell` + `let-row="row"` Required
`ColumnDefDirective` queries for the template using `@ContentChild('cell')`. The template context provides `{ $implicit: cellValue, row: fullRow, index: i }`.
- Template reference **must** be `#cell`.
- To access the full row: `let-row="row"` (explicit binding).
- `let-row` alone binds to `$implicit` = the single cell value, not the full row record.

### 9.3 `dsb-header` Has No Content Projection
`dsb-header` declares `ngContentSelectors: never`. Nothing can be projected into it. `UserProfileMenuComponent` must live as a sibling element in the layout, positioned via CSS.

### 9.4 `dsb-footer` — `FooterColumn.heading` Not `.title`
The `FooterColumn` interface has `heading: string`, not `title`. Using `title` silently produces an empty column heading.

### 9.5 `dsb-modal` — `[modal-title]` Slot Is Mutually Exclusive With `title` Input
The modal template renders `<h2 *ngIf="title">{{ title }}</h2>` OR `<ng-content select="[modal-title]" *ngIf="!title">`. You cannot use both. When you need a custom header (e.g., title + badge), omit the `title` input and use the `[modal-title]` slot.

### 9.6 `dsb-modal` Footer — Split Layout Needs `flex:1`
The `.modal-footer` wrapper has `display:flex; justify-content:flex-end`. For a split left/right layout, apply `flex:1` on the single projected `<div modal-footer>` so it fills the full width, then internally use `justify-content:space-between`.

### 9.7 `dsb-dropdown` — Avoid for Right-Edge Menus
The `dsb-dropdown` panel is positioned `left:0; right:0` relative to the trigger. When the trigger is near the right viewport edge the panel is clipped. For `UserProfileMenuComponent` (top-right of header) use a custom CSS dropdown with `right:0; left:auto`.

### 9.8 `ThroughputChartComponent` — Bar Fill Colour
Use `background-color: #000000` for chart bars. Do not use a CSS token variable for the bar fill — the desired colour is solid black.


