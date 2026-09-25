import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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

type DialogName = 'details' | 'edit' | 'invite' | 'delete';

const ROLE_VARIANTS: Record<UserRole, TagVariant> = {
  Admin: 'danger',
  Editor: 'info',
  Viewer: 'default',
};

const STATUS_VARIANTS: Record<UserStatus, TagVariant> = {
  Active: 'success',
  Inactive: 'default',
};

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
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  users: User[] = [];
  loading = true;
  saving = false;

  selected: User | null = null;
  dialog: DialogName | null = null;

  /** Avatar URLs that failed to load; those rows fall back to initials. */
  private readonly brokenAvatars = new Set<string>();

  readonly roleOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  readonly editForm = this.memberForm();
  readonly inviteForm = this.memberForm();
  editSubmitted = false;
  inviteSubmitted = false;

  readonly detailsForm = this.fb.nonNullable.group({
    firstName: [{ value: '', disabled: true }],
    lastName: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
    role: [{ value: '', disabled: true }],
  });

  ngOnInit(): void {
    this.reload();
  }

  get rows(): Record<string, unknown>[] {
    return this.users as unknown as Record<string, unknown>[];
  }

  asUser(row: Record<string, unknown>): User {
    return row as unknown as User;
  }

  avatarSrc(user: User): string {
    return this.brokenAvatars.has(user.avatar) ? '' : user.avatar;
  }

  roleVariant(role: string): TagVariant {
    return ROLE_VARIANTS[role as UserRole] ?? 'default';
  }

  statusVariant(status: string): TagVariant {
    return STATUS_VARIANTS[status as UserStatus] ?? 'default';
  }

  hasError(form: 'edit' | 'invite', field: 'firstName' | 'lastName' | 'email' | 'role'): boolean {
    const group = form === 'edit' ? this.editForm : this.inviteForm;
    const submitted = form === 'edit' ? this.editSubmitted : this.inviteSubmitted;
    const control = group.controls[field];
    return control.invalid && (control.touched || submitted);
  }

  emailError(form: 'edit' | 'invite'): string {
    const group = form === 'edit' ? this.editForm : this.inviteForm;
    return group.controls.email.hasError('required') ? 'Email address is required' : 'Enter a valid email address';
  }

  // ── Dialog openers ────────────────────────────────────────────────

  openDetails(user: User): void {
    this.selected = user;
    const { firstName, lastName } = this.splitName(user.name);
    this.detailsForm.setValue({ firstName, lastName, email: user.email, role: user.role });
    this.dialog = 'details';
  }

  openEdit(user: User): void {
    this.selected = user;
    const { firstName, lastName } = this.splitName(user.name);
    this.editForm.reset({ firstName, lastName, email: user.email, role: user.role });
    this.editSubmitted = false;
    this.dialog = 'edit';
  }

  openInvite(): void {
    this.selected = null;
    this.inviteForm.reset();
    this.inviteSubmitted = false;
    this.dialog = 'invite';
  }

  openDelete(user: User): void {
    this.selected = user;
    this.dialog = 'delete';
  }

  /** From the edit dialog: swap to the delete confirmation, keeping the selection. */
  editToDelete(): void {
    this.dialog = 'delete';
  }

  closeDialog(): void {
    this.dialog = null;
    this.selected = null;
  }

  // ── Mutations ─────────────────────────────────────────────────────

  saveEdit(): void {
    this.editSubmitted = true;
    if (!this.selected || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = {
      ...this.selected,
      name: this.joinName(firstName, lastName),
      email: email.trim(),
      role: role as UserRole,
    };
    this.saving = true;
    this.usersService.update(updated.id, updated).subscribe({
      next: () => {
        this.saving = false;
        this.closeDialog();
        this.reload();
      },
      error: () => (this.saving = false),
    });
  }

  sendInvite(): void {
    this.inviteSubmitted = true;
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = this.joinName(firstName, lastName);
    const member: Omit<User, 'id'> = {
      name,
      email: email.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      role: role as UserRole,
      status: 'Active',
      joinedDate: this.today(),
    };
    this.saving = true;
    this.usersService.create(member).subscribe({
      next: () => {
        this.saving = false;
        this.inviteForm.reset();
        this.inviteSubmitted = false;
        this.closeDialog();
        this.reload();
      },
      error: () => (this.saving = false),
    });
  }

  confirmDelete(): void {
    if (!this.selected) {
      return;
    }
    this.saving = true;
    this.usersService.delete(this.selected.id).subscribe({
      next: () => {
        this.saving = false;
        this.closeDialog();
        this.reload();
      },
      error: () => (this.saving = false),
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private reload(): void {
    this.loading = true;
    this.usersService.getAll().subscribe((users) => {
      this.users = users;
      this.loading = false;
      users.forEach((u) => this.probeAvatar(u.avatar));
    });
  }

  private probeAvatar(url: string): void {
    if (!url || this.brokenAvatars.has(url)) {
      return;
    }
    const img = new Image();
    img.onerror = () => {
      this.brokenAvatars.add(url);
      this.users = [...this.users];
    };
    img.src = url;
  }

  private memberForm() {
    return this.fb.nonNullable.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
    });
  }

  private splitName(name: string): { firstName: string; lastName: string } {
    const parts = name.trim().split(/\s+/);
    return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
  }

  private joinName(first: string, last: string): string {
    return `${first.trim()} ${last.trim()}`.trim();
  }

  private today(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}
