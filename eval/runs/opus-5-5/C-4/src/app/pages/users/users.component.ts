import { Component, OnInit, inject, signal } from '@angular/core';
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

type MemberForm = FormGroup<{
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  role: FormControl<UserRole | ''>;
}>;

type Dialog = 'details' | 'edit' | 'invite' | 'delete' | null;

const ROLE_VARIANT: Record<UserRole, TagVariant> = { Admin: 'danger', Editor: 'info', Viewer: 'default' };
const STATUS_VARIANT: Record<UserStatus, TagVariant> = { Active: 'success', Inactive: 'default' };

function createMemberForm(): MemberForm {
  return new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl<UserRole | ''>('', { nonNullable: true, validators: [Validators.required] }),
  });
}

function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
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
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dialog = signal<Dialog>(null);
  readonly selected = signal<User | null>(null);
  /** Avatar URLs that failed to load; those rows fall back to initials. */
  readonly brokenAvatars = signal<ReadonlySet<string>>(new Set());

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

  private editSubmitted = false;
  private inviteSubmitted = false;

  ngOnInit(): void {
    this.load();
  }

  // Table rows are typed loosely by dsb-table; this narrows them back to User.
  asUser(row: Record<string, unknown>): User {
    return row as unknown as User;
  }

  get rows(): Record<string, unknown>[] {
    return this.users() as unknown as Record<string, unknown>[];
  }

  roleVariant(role: UserRole): TagVariant {
    return ROLE_VARIANT[role] ?? 'default';
  }

  statusVariant(status: UserStatus): TagVariant {
    return STATUS_VARIANT[status] ?? 'default';
  }

  avatarSrc(user: User): string {
    return user.avatar && !this.brokenAvatars().has(user.avatar) ? user.avatar : '';
  }

  showError(form: MemberForm, name: keyof MemberForm['controls']): boolean {
    const control = form.controls[name];
    const submitted = form === this.editForm ? this.editSubmitted : this.inviteSubmitted;
    return control.invalid && (control.touched || submitted);
  }

  errorFor(form: MemberForm, name: keyof MemberForm['controls']): string {
    if (!this.showError(form, name)) return '';
    const control = form.controls[name];
    if (control.hasError('email')) return 'Enter a valid email address';
    return {
      firstName: 'First name is required',
      lastName: 'Last name is required',
      email: 'Email address is required',
      role: 'Role is required',
    }[name];
  }

  // ---- dialogs ---------------------------------------------------------------

  openDetails(user: User): void {
    this.selected.set(user);
    this.detailsForm.setValue({ ...splitName(user.name), email: user.email, role: user.role });
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    this.selected.set(user);
    this.editSubmitted = false;
    this.editForm.reset({ ...splitName(user.name), email: user.email, role: user.role });
    this.dialog.set('edit');
  }

  openInvite(): void {
    this.selected.set(null);
    this.inviteSubmitted = false;
    this.inviteForm.reset();
    this.dialog.set('invite');
  }

  openDelete(user: User): void {
    this.selected.set(user);
    this.dialog.set('delete');
  }

  /** From the edit dialog: swap to the delete confirmation, keeping the selection. */
  editToDelete(): void {
    this.dialog.set('delete');
  }

  closeDialog(): void {
    this.dialog.set(null);
    this.selected.set(null);
  }

  // ---- CRUD ------------------------------------------------------------------

  load(): void {
    this.loading.set(true);
    this.usersService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
        this.probeAvatars(users);
      },
      error: () => this.loading.set(false),
    });
  }

  saveEdit(): void {
    const user = this.selected();
    this.editSubmitted = true;
    if (!user || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: `${firstName.trim()} ${lastName.trim()}`, email: email.trim(), role: role as UserRole };
    this.saving.set(true);
    this.usersService.update(user.id, updated).subscribe({
      next: () => this.afterMutation(),
      error: () => this.saving.set(false),
    });
  }

  sendInvite(): void {
    this.inviteSubmitted = true;
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = `${firstName.trim()} ${lastName.trim()}`;
    this.saving.set(true);
    this.usersService
      .create({
        name,
        email: email.trim(),
        role: role as UserRole,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        status: 'Active',
        joinedDate: new Date().toISOString().slice(0, 10),
      })
      .subscribe({
        next: () => {
          this.inviteForm.reset();
          this.inviteSubmitted = false;
          this.afterMutation();
        },
        error: () => this.saving.set(false),
      });
  }

  confirmDelete(): void {
    const user = this.selected();
    if (!user) return;
    this.saving.set(true);
    this.usersService.delete(user.id).subscribe({
      next: () => this.afterMutation(),
      error: () => this.saving.set(false),
    });
  }

  private afterMutation(): void {
    this.saving.set(false);
    this.closeDialog();
    this.load();
  }

  private probeAvatars(users: User[]): void {
    for (const { avatar } of users) {
      if (!avatar || this.brokenAvatars().has(avatar)) continue;
      const img = new Image();
      img.onerror = () => this.brokenAvatars.update((set) => new Set(set).add(avatar));
      img.src = avatar;
    }
  }
}
