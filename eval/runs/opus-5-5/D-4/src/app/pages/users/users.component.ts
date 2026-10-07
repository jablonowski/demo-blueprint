import { Component, OnInit, inject, signal } from '@angular/core';
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

type MemberForm = FormGroup<{
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  role: FormControl<UserRole | ''>;
}>;

function createMemberForm(disabled = false): MemberForm {
  const control = <T>(value: T, validators = [Validators.required]) =>
    new FormControl<T>({ value, disabled }, { nonNullable: true, validators });
  return new FormGroup({
    firstName: control(''),
    lastName: control(''),
    email: control('', [Validators.required, Validators.email]),
    role: control<UserRole | ''>(''),
  });
}

const ROLE_VARIANT: Record<UserRole, TagVariant> = {
  Admin: 'danger',
  Editor: 'info',
  Viewer: 'default',
};

const STATUS_VARIANT: Record<UserStatus, TagVariant> = {
  Active: 'success',
  Inactive: 'default',
};

@Component({
  selector: 'app-users',
  imports: [
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
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly selected = signal<User | null>(null);

  readonly deleteOpen = signal(false);
  readonly detailsOpen = signal(false);
  readonly editOpen = signal(false);
  readonly inviteOpen = signal(false);

  readonly roleOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  readonly detailsForm = createMemberForm(true);
  readonly editForm = createMemberForm();
  readonly inviteForm = createMemberForm();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.usersService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  rows(): Record<string, unknown>[] {
    return this.users() as unknown as Record<string, unknown>[];
  }

  asUser(row: Record<string, unknown>): User {
    return row as unknown as User;
  }

  roleVariant(role: UserRole): TagVariant {
    return ROLE_VARIANT[role] ?? 'default';
  }

  statusVariant(status: UserStatus): TagVariant {
    return STATUS_VARIANT[status] ?? 'default';
  }

  /** "2024-01-15" → "January 2024", parsed as a local date so the month never shifts. */
  memberSince(user: User): string {
    const [y, m] = user.joinedDate.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  joinedLabel(user: User): string {
    const [y, m, d] = user.joinedDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  showError(form: MemberForm, name: keyof MemberForm['controls']): boolean {
    const control = form.controls[name];
    return control.invalid && control.touched;
  }

  emailError(form: MemberForm): string {
    return form.controls.email.hasError('email') ? 'Enter a valid email address' : 'Email address is required';
  }

  // ── Details ────────────────────────────────────────────────
  openDetails(user: User): void {
    this.selected.set(user);
    this.detailsForm.setValue({ ...splitName(user.name), email: user.email, role: user.role });
    this.detailsOpen.set(true);
  }

  // ── Edit ───────────────────────────────────────────────────
  openEdit(user: User): void {
    this.selected.set(user);
    this.editForm.reset({ ...splitName(user.name), email: user.email, role: user.role });
    this.editOpen.set(true);
  }

  saveEdit(): void {
    const user = this.selected();
    if (!user) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: joinName(firstName, lastName), email: email.trim(), role: role as UserRole };
    this.saving.set(true);
    this.usersService.update(user.id, updated).subscribe({
      next: () => {
        this.saving.set(false);
        this.editOpen.set(false);
        this.selected.set(null);
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  editToDelete(): void {
    this.editOpen.set(false);
    this.deleteOpen.set(true);
  }

  // ── Delete ─────────────────────────────────────────────────
  openDelete(user: User): void {
    this.selected.set(user);
    this.deleteOpen.set(true);
  }

  confirmDelete(): void {
    const user = this.selected();
    if (!user) return;
    this.saving.set(true);
    this.usersService.delete(user.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.deleteOpen.set(false);
        this.selected.set(null);
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  // ── Invite ─────────────────────────────────────────────────
  openInvite(): void {
    this.inviteForm.reset({ firstName: '', lastName: '', email: '', role: '' });
    this.inviteOpen.set(true);
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = joinName(firstName, lastName);
    const member: Omit<User, 'id'> = {
      name,
      email: email.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      role: role as UserRole,
      status: 'Active',
      joinedDate: todayIso(),
    };
    this.saving.set(true);
    this.usersService.create(member).subscribe({
      next: () => {
        this.saving.set(false);
        this.inviteOpen.set(false);
        this.inviteForm.reset({ firstName: '', lastName: '', email: '', role: '' });
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  /** Clears the selection when a dialog that owns it is dismissed. */
  onDialogClosed(): void {
    if (!this.deleteOpen() && !this.editOpen() && !this.detailsOpen()) {
      this.selected.set(null);
    }
  }
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

function joinName(first: string, last: string): string {
  return `${first.trim()} ${last.trim()}`.trim();
}

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
