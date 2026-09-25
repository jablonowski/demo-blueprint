import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
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
import { ImgErrorDirective } from './img-error.directive';

type MemberForm = ReturnType<UsersComponent['buildMemberForm']>;

@Component({
  selector: 'app-users',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    AvatarComponent,
    ButtonComponent,
    ColumnDefDirective,
    DropdownComponent,
    InputComponent,
    ModalComponent,
    TableComponent,
    TagComponent,
    ImgErrorDirective,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly selected = signal<User | null>(null);
  readonly brokenAvatars = signal<ReadonlySet<number>>(new Set());

  readonly deleteOpen = signal(false);
  readonly detailsOpen = signal(false);
  readonly editOpen = signal(false);
  readonly inviteOpen = signal(false);

  readonly editSubmitted = signal(false);
  readonly inviteSubmitted = signal(false);
  readonly saving = signal(false);

  readonly roleOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  readonly editForm = this.buildMemberForm();
  readonly inviteForm = this.buildMemberForm();

  readonly detailsForm = this.fb.nonNullable.group({
    firstName: [{ value: '', disabled: true }],
    lastName: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
    role: [{ value: '', disabled: true }],
  });

  constructor() {
    this.load();
  }

  get rows(): Record<string, unknown>[] {
    return this.users() as unknown as Record<string, unknown>[];
  }

  asUser(row: Record<string, unknown>): User {
    return row as unknown as User;
  }

  avatarSrc(user: User): string {
    return this.brokenAvatars().has(user.id) ? '' : user.avatar;
  }

  markAvatarBroken(user: User): void {
    this.brokenAvatars.update((set) => new Set(set).add(user.id));
  }

  roleVariant(role: UserRole): TagVariant {
    return role === 'Admin' ? 'danger' : role === 'Editor' ? 'info' : 'default';
  }

  statusVariant(status: UserStatus): TagVariant {
    return status === 'Active' ? 'success' : 'default';
  }

  showError(form: MemberForm, submitted: boolean, field: keyof MemberForm['controls']): boolean {
    const control = form.controls[field];
    return control.invalid && (control.touched || submitted);
  }

  emailError(form: MemberForm): string {
    return form.controls.email.hasError('email') ? 'Enter a valid email address' : 'Email address is required';
  }

  // Details
  openDetails(user: User): void {
    this.selected.set(user);
    const { first, last } = this.splitName(user.name);
    this.detailsForm.setValue({ firstName: first, lastName: last, email: user.email, role: user.role });
    this.detailsOpen.set(true);
  }

  // Edit
  openEdit(user: User): void {
    this.selected.set(user);
    const { first, last } = this.splitName(user.name);
    this.editForm.reset({ firstName: first, lastName: last, email: user.email, role: user.role });
    this.editSubmitted.set(false);
    this.editOpen.set(true);
  }

  saveEdit(): void {
    const user = this.selected();
    this.editSubmitted.set(true);
    if (!user || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: this.joinName(firstName, lastName), email: email.trim(), role: role as UserRole };
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

  // Delete
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
        this.load();
        this.deleteOpen.set(false);
        this.selected.set(null);
      },
      error: () => this.saving.set(false),
    });
  }

  // Invite
  openInvite(): void {
    this.inviteForm.reset();
    this.inviteSubmitted.set(false);
    this.inviteOpen.set(true);
  }

  sendInvite(): void {
    this.inviteSubmitted.set(true);
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = this.joinName(firstName, lastName);
    const newUser: Omit<User, 'id'> = {
      name,
      email: email.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName.trim() || name)}`,
      role: role as UserRole,
      status: 'Active',
      joinedDate: this.today(),
    };
    this.saving.set(true);
    this.usersService.create(newUser).subscribe({
      next: () => {
        this.saving.set(false);
        this.inviteOpen.set(false);
        this.inviteForm.reset();
        this.inviteSubmitted.set(false);
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  /** Closing a dialog by any route (backdrop, ×, Escape, Cancel) drops the selection. */
  onDialogClosed(dialog: 'details' | 'edit' | 'delete' | 'invite'): void {
    if (dialog === 'details') this.detailsOpen.set(false);
    if (dialog === 'invite') this.inviteOpen.set(false);
    if (dialog === 'edit') {
      this.editOpen.set(false);
      // Edit → Delete hands the selection over; only clear it if no dialog took it.
      if (!this.deleteOpen()) this.selected.set(null);
      return;
    }
    if (dialog === 'delete') this.deleteOpen.set(false);
    if (!this.editOpen() && !this.deleteOpen() && !this.detailsOpen()) this.selected.set(null);
  }

  private load(): void {
    this.loading.set(this.users().length === 0);
    this.usersService.getAll().subscribe((users) => {
      this.users.set(users);
      this.loading.set(false);
    });
  }

  private buildMemberForm() {
    return this.fb.nonNullable.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
    });
  }

  private splitName(name: string): { first: string; last: string } {
    const parts = name.trim().split(/\s+/);
    return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
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
