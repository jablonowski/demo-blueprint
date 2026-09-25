import { NgTemplateOutlet, formatDate } from '@angular/common';
import { Component, LOCALE_ID, OnInit, inject, signal } from '@angular/core';
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

import { AvatarFallbackDirective } from '../../core/avatar-fallback.directive';
import { User, UserRole, UserStatus } from '../../core/user.model';
import { UsersService } from '../../core/users.service';

type MemberForm = FormGroup<{
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  role: FormControl<UserRole | ''>;
}>;

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
    NgTemplateOutlet,
    ReactiveFormsModule,
    AvatarComponent,
    AvatarFallbackDirective,
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
  private readonly locale = inject(LOCALE_ID);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  selected: User | null = null;

  deleteOpen = false;
  detailsOpen = false;
  editOpen = false;
  inviteOpen = false;

  readonly roleOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  readonly editForm = createMemberForm();
  readonly inviteForm = createMemberForm();
  editSubmitted = false;
  inviteSubmitted = false;

  /** Read-only view of the selected member for the details dialog. */
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
    this.loading.set(true);
    this.usersService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  asUser(row: Record<string, unknown>): User {
    return row as unknown as User;
  }

  roleVariant(role: UserRole): TagVariant {
    return role === 'Admin' ? 'primary' : role === 'Editor' ? 'info' : 'default';
  }

  statusVariant(status: UserStatus): TagVariant {
    return status === 'Active' ? 'success' : 'default';
  }

  memberSince(user: User): string {
    return formatDate(user.joinedDate, 'MMMM y', this.locale);
  }

  showError(form: MemberForm, submitted: boolean, name: keyof MemberForm['controls']): boolean {
    const control = form.controls[name];
    return control.invalid && (control.touched || submitted);
  }

  emailError(form: MemberForm): string {
    return form.controls.email.hasError('required') ? 'Email address is required' : 'Enter a valid email address';
  }

  // Details
  openDetails(user: User): void {
    this.selected = user;
    this.detailsForm.setValue({ ...splitName(user.name), email: user.email, role: user.role });
    this.detailsOpen = true;
  }

  // Edit
  openEdit(user: User): void {
    this.selected = user;
    this.editSubmitted = false;
    this.editForm.reset({ ...splitName(user.name), email: user.email, role: user.role });
    this.editOpen = true;
  }

  saveEdit(): void {
    this.editSubmitted = true;
    const user = this.selected;
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
        this.editOpen = false;
        this.selected = null;
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  /** Hands over from the edit dialog to the delete confirmation, keeping the selection. */
  deleteFromEdit(): void {
    this.editOpen = false;
    this.deleteOpen = true;
  }

  // Delete
  openDelete(user: User): void {
    this.selected = user;
    this.deleteOpen = true;
  }

  confirmDelete(): void {
    const user = this.selected;
    if (!user) {
      return;
    }
    this.saving.set(true);
    this.usersService.delete(user.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.deleteOpen = false;
        this.selected = null;
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  // Invite
  openInvite(): void {
    this.inviteSubmitted = false;
    this.inviteForm.reset();
    this.inviteOpen = true;
  }

  sendInvite(): void {
    this.inviteSubmitted = true;
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    const newUser: Omit<User, 'id'> = {
      name,
      email: email.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      role: role as UserRole,
      status: 'Active',
      joinedDate: formatDate(new Date(), 'yyyy-MM-dd', this.locale),
    };
    this.saving.set(true);
    this.usersService.create(newUser).subscribe({
      next: () => {
        this.saving.set(false);
        this.inviteOpen = false;
        this.inviteForm.reset();
        this.inviteSubmitted = false;
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  onDialogClosed(): void {
    // Keep the selection while the edit dialog hands over to the delete confirmation.
    if (!this.deleteOpen && !this.editOpen) {
      this.selected = null;
    }
  }
}
