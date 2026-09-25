import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
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
  role: FormControl<string>;
}>;

function createMemberForm(): MemberForm {
  return new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    role: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
}

function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
}

const ROLE_TAG: Record<UserRole, TagVariant> = { Admin: 'danger', Editor: 'info', Viewer: 'default' };
const STATUS_TAG: Record<UserStatus, TagVariant> = { Active: 'success', Inactive: 'default' };

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
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly selected = signal<User | null>(null);

  readonly deleteOpen = signal(false);
  readonly detailsOpen = signal(false);
  readonly editOpen = signal(false);
  readonly inviteOpen = signal(false);

  readonly saving = signal(false);
  readonly editSubmitted = signal(false);
  readonly inviteSubmitted = signal(false);

  /** Avatar URLs that failed to load; those rows fall back to initials. */
  private readonly brokenAvatars = signal<ReadonlySet<string>>(new Set());
  private readonly probedAvatars = new Set<string>();

  readonly roleOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  readonly editForm = createMemberForm();
  readonly inviteForm = createMemberForm();

  readonly detailsForm = new FormGroup({
    firstName: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    lastName: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    email: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    role: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.usersService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
        users.forEach((u) => this.probeAvatar(u.avatar));
      },
      error: () => this.loading.set(false),
    });
  }

  /** dsb-table hands templates a generic row; the rows are always Users. */
  user(row: Record<string, unknown>): User {
    return row as unknown as User;
  }

  get rows(): Record<string, unknown>[] {
    return this.users() as unknown as Record<string, unknown>[];
  }

  avatarSrc(user: User): string {
    return this.brokenAvatars().has(user.avatar) ? '' : user.avatar;
  }

  roleTag(role: UserRole): TagVariant {
    return ROLE_TAG[role] ?? 'default';
  }

  statusTag(status: UserStatus): TagVariant {
    return STATUS_TAG[status] ?? 'default';
  }

  showError(form: MemberForm, submitted: boolean, name: keyof MemberForm['controls']): boolean {
    const control = form.controls[name];
    return control.invalid && (control.touched || submitted);
  }

  // Details
  openDetails(user: User): void {
    const { first, last } = splitName(user.name);
    this.selected.set(user);
    this.detailsForm.setValue({ firstName: first, lastName: last, email: user.email, role: user.role });
    this.detailsOpen.set(true);
  }

  closeDetails(): void {
    this.detailsOpen.set(false);
    this.selected.set(null);
  }

  // Edit
  openEdit(user: User): void {
    const { first, last } = splitName(user.name);
    this.selected.set(user);
    this.editSubmitted.set(false);
    this.editForm.reset({ firstName: first, lastName: last, email: user.email, role: user.role });
    this.editOpen.set(true);
  }

  closeEdit(): void {
    this.editOpen.set(false);
    this.selected.set(null);
  }

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
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      email: email.trim(),
      role: role as UserRole,
    };
    this.saving.set(true);
    this.usersService.update(user.id, updated).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeEdit();
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  /** Edit → delete hand-off keeps the selection so the confirmation knows who. */
  deleteFromEdit(): void {
    this.editOpen.set(false);
    this.deleteOpen.set(true);
  }

  // Delete
  openDelete(user: User): void {
    this.selected.set(user);
    this.deleteOpen.set(true);
  }

  closeDelete(): void {
    this.deleteOpen.set(false);
    this.selected.set(null);
  }

  confirmDelete(): void {
    const user = this.selected();
    if (!user) {
      return;
    }
    this.saving.set(true);
    this.usersService.delete(user.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeDelete();
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  // Invite
  openInvite(): void {
    this.inviteSubmitted.set(false);
    this.inviteForm.reset();
    this.inviteOpen.set(true);
  }

  closeInvite(): void {
    this.inviteOpen.set(false);
  }

  sendInvite(): void {
    this.inviteSubmitted.set(true);
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    const today = new Date();
    const joinedDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');

    this.saving.set(true);
    this.usersService
      .create({
        name,
        email: email.trim(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        role: role as UserRole,
        status: 'Active',
        joinedDate,
      })
      .subscribe({
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

  private probeAvatar(url: string): void {
    if (!url || this.probedAvatars.has(url)) {
      return;
    }
    this.probedAvatars.add(url);
    const img = new Image();
    img.onerror = () => this.brokenAvatars.update((set) => new Set(set).add(url));
    img.src = url;
  }
}
