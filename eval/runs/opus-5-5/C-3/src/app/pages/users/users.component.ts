import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
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

import { User, USER_ROLES, UserRole, UserStatus } from '../../core/user.model';
import { UsersService } from '../../core/users.service';

type Dialog = 'none' | 'details' | 'edit' | 'invite' | 'delete';

const ROLE_TONE: Record<UserRole, TagVariant> = {
  Admin: 'danger',
  Editor: 'info',
  Viewer: 'default',
};

const STATUS_TONE: Record<UserStatus, TagVariant> = {
  Active: 'success',
  Inactive: 'default',
};

function memberForm() {
  return new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
}

type MemberForm = ReturnType<typeof memberForm>;

function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

function joinName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

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
  readonly saving = signal(false);
  readonly dialog = signal<Dialog>('none');
  readonly selected = signal<User | null>(null);

  readonly roleOptions: DropdownOption[] = USER_ROLES.map((role) => ({ value: role, label: role }));

  readonly editForm = memberForm();
  readonly inviteForm = memberForm();
  readonly detailsForm = new FormGroup({
    firstName: new FormControl({ value: '', disabled: true }),
    lastName: new FormControl({ value: '', disabled: true }),
    email: new FormControl({ value: '', disabled: true }),
    role: new FormControl({ value: '', disabled: true }),
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.usersService.getAll().subscribe((users) => {
      this.users.set(users);
      this.loading.set(false);
    });
  }

  roleTone(role: unknown): TagVariant {
    return ROLE_TONE[role as UserRole] ?? 'default';
  }

  statusTone(status: unknown): TagVariant {
    return STATUS_TONE[status as UserStatus] ?? 'default';
  }

  asUser(row: Record<string, unknown>): User {
    return row as unknown as User;
  }

  showError(form: MemberForm, field: keyof MemberForm['controls']): boolean {
    const control = form.controls[field];
    return control.invalid && control.touched;
  }

  errorFor(form: MemberForm, field: keyof MemberForm['controls'], label: string): string {
    const control = form.controls[field];
    if (control.hasError('required')) {
      return `${label} is required`;
    }
    if (control.hasError('email')) {
      return 'Enter a valid email address';
    }
    return '';
  }

  // Dialog openers

  openDetails(user: User): void {
    this.selected.set(user);
    this.detailsForm.setValue({ ...splitName(user.name), email: user.email, role: user.role });
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    this.selected.set(user);
    this.editForm.reset({ ...splitName(user.name), email: user.email, role: user.role });
    this.dialog.set('edit');
  }

  openInvite(): void {
    this.selected.set(null);
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
    this.dialog.set('none');
    this.selected.set(null);
  }

  // Mutations

  saveEdit(): void {
    const user = this.selected();
    if (!user) {
      return;
    }
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: joinName(firstName, lastName), email, role: role as UserRole };
    this.saving.set(true);
    this.usersService.update(user.id, updated).subscribe(() => {
      this.saving.set(false);
      this.load();
      this.closeDialog();
    });
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = joinName(firstName, lastName);
    const newUser: Omit<User, 'id'> = {
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName.trim() || name)}`,
      role: role as UserRole,
      status: 'Active',
      joinedDate: new Date().toISOString().slice(0, 10),
    };
    this.saving.set(true);
    this.usersService.create(newUser).subscribe(() => {
      this.saving.set(false);
      this.load();
      this.inviteForm.reset();
      this.closeDialog();
    });
  }

  confirmDelete(): void {
    const user = this.selected();
    if (!user) {
      return;
    }
    this.saving.set(true);
    this.usersService.delete(user.id).subscribe(() => {
      this.saving.set(false);
      this.load();
      this.closeDialog();
    });
  }
}
