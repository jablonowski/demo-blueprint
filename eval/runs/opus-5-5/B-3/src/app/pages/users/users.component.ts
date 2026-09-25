import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AvatarComponent,
  ButtonComponent,
  ColumnDefDirective,
  DropdownComponent,
  DropdownOption,
  InputComponent,
  ModalComponent,
  TableComponent,
  TagComponent,
  TagVariant,
} from '@jablonowski/dsb-components';
import { User, UserRole, UserStatus } from '../../core/user.model';
import { UsersService } from '../../core/users.service';

type Dialog = 'details' | 'edit' | 'invite' | 'delete' | null;

const ROLE_TONE: Record<UserRole, TagVariant> = { Admin: 'danger', Editor: 'info', Viewer: 'default' };
const STATUS_TONE: Record<UserStatus, TagVariant> = { Active: 'success', Inactive: 'default' };

function memberForm() {
  return new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl<UserRole | ''>('', { nonNullable: true, validators: [Validators.required] }),
  });
}

type MemberForm = ReturnType<typeof memberForm>;

function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

/** `YYYY-MM-DD` parsed as a local date, so the month never shifts across time zones. */
function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

@Component({
  selector: 'app-users',
  imports: [
    DatePipe,
    NgTemplateOutlet,
    ReactiveFormsModule,
    AvatarComponent,
    ButtonComponent,
    ColumnDefDirective,
    DropdownComponent,
    InputComponent,
    ModalComponent,
    TableComponent,
    TagComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent {
  private readonly usersService = inject(UsersService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dialog = signal<Dialog>(null);
  readonly selected = signal<User | null>(null);

  /** Avatar URLs that failed to load; those rows fall back to initials. */
  private readonly brokenAvatars = signal<ReadonlySet<string>>(new Set());

  readonly rows = computed(() => this.users() as unknown as Record<string, unknown>[]);

  readonly roleOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  readonly editForm = memberForm();
  readonly inviteForm = memberForm();
  readonly editSubmitted = signal(false);
  readonly inviteSubmitted = signal(false);

  /** Read-only mirror of the selected member for the details dialog. */
  readonly detailsForm = new FormGroup({
    firstName: new FormControl({ value: '', disabled: true }),
    lastName: new FormControl({ value: '', disabled: true }),
    email: new FormControl({ value: '', disabled: true }),
    role: new FormControl({ value: '', disabled: true }),
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.usersService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
        users.forEach((u) => this.probeAvatar(u.avatar));
      },
      error: () => this.loading.set(false),
    });
  }

  asUser(row: unknown): User {
    return row as User;
  }

  avatarSrc(user: User): string {
    return this.brokenAvatars().has(user.avatar) ? '' : user.avatar;
  }

  roleTone(role: UserRole): TagVariant {
    return ROLE_TONE[role] ?? 'default';
  }

  statusTone(status: UserStatus): TagVariant {
    return STATUS_TONE[status] ?? 'default';
  }

  joined(user: User): Date {
    return parseDate(user.joinedDate);
  }

  showError(form: MemberForm, submitted: boolean, name: keyof MemberForm['controls']): boolean {
    const control = form.controls[name];
    return control.invalid && (control.touched || submitted);
  }

  emailError(form: MemberForm): string {
    return form.controls.email.hasError('required') ? 'Email address is required' : 'Enter a valid email address';
  }

  // ---- dialogs -------------------------------------------------------------

  openDetails(user: User): void {
    this.selected.set(user);
    this.detailsForm.setValue({ ...splitName(user.name), email: user.email, role: user.role });
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    this.selected.set(user);
    this.editSubmitted.set(false);
    this.editForm.reset({ ...splitName(user.name), email: user.email, role: user.role });
    this.dialog.set('edit');
  }

  openInvite(): void {
    this.selected.set(null);
    this.inviteSubmitted.set(false);
    this.inviteForm.reset();
    this.dialog.set('invite');
  }

  openDelete(user: User): void {
    this.selected.set(user);
    this.dialog.set('delete');
  }

  /** From the edit dialog: swap to the confirmation, keeping the selection. */
  editToDelete(): void {
    this.dialog.set('delete');
  }

  /** Called by every dialog's close path (✕, backdrop, Escape, Cancel). */
  closeDialog(which: Exclude<Dialog, null>): void {
    // A dialog that is already being replaced (edit → delete) must not clear the new one.
    if (this.dialog() !== which) return;
    this.dialog.set(null);
    this.selected.set(null);
  }

  // ---- CRUD ----------------------------------------------------------------

  saveEdit(): void {
    const user = this.selected();
    this.editSubmitted.set(true);
    if (!user || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = {
      ...user,
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      role: role as UserRole,
    };
    this.saving.set(true);
    this.usersService.update(user.id, updated).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeDialog('edit');
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  sendInvite(): void {
    this.inviteSubmitted.set(true);
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = `${firstName.trim()} ${lastName.trim()}`;
    const member: Omit<User, 'id'> = {
      name,
      email: email.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName.trim())}`,
      role: role as UserRole,
      status: 'Active',
      joinedDate: today(),
    };
    this.saving.set(true);
    this.usersService.create(member).subscribe({
      next: () => {
        this.saving.set(false);
        this.inviteForm.reset();
        this.inviteSubmitted.set(false);
        this.closeDialog('invite');
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete(): void {
    const user = this.selected();
    if (!user) return;
    this.saving.set(true);
    this.usersService.delete(user.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeDialog('delete');
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  private probeAvatar(url: string): void {
    if (!url || this.brokenAvatars().has(url)) return;
    const img = new Image();
    img.onerror = () => this.brokenAvatars.update((set) => new Set(set).add(url));
    img.src = url;
  }
}
