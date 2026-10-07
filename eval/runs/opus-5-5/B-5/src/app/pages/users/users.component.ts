import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet, formatDate } from '@angular/common';
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
import { USER_ROLES, User, UserRole, UserStatus } from '../../data/user.model';
import { UsersService } from '../../data/users.service';
import { MemberIdentityComponent } from './member-identity.component';

type Dialog = 'details' | 'edit' | 'invite' | 'delete';

const ROLE_TONE: Record<UserRole, TagVariant> = { Admin: 'danger', Editor: 'info', Viewer: 'default' };
const STATUS_TONE: Record<UserStatus, TagVariant> = { Active: 'success', Inactive: 'default' };

function memberForm() {
  return new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    lastName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl<UserRole | ''>('', { nonNullable: true, validators: Validators.required }),
  });
}

type MemberForm = ReturnType<typeof memberForm>;

function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

@Component({
  selector: 'app-users',
  imports: [
    DatePipe,
    NgTemplateOutlet,
    AvatarComponent,
    ReactiveFormsModule,
    ButtonComponent,
    ColumnDefDirective,
    DropdownComponent,
    InputComponent,
    ModalComponent,
    TableComponent,
    TagComponent,
    MemberIdentityComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly selected = signal<User | null>(null);
  readonly dialog = signal<Dialog | null>(null);
  readonly saving = signal(false);

  readonly roleOptions: DropdownOption[] = USER_ROLES.map(role => ({ value: role, label: role }));

  readonly editForm = memberForm();
  readonly inviteForm = memberForm();

  /** Read-only copy of the selected member for the details dialog; disabled controls render as disabled fields. */
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
    this.loading.set(true);
    this.usersService.getAll().subscribe({
      next: users => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  roleTone(role: unknown): TagVariant {
    return ROLE_TONE[role as UserRole] ?? 'default';
  }

  statusTone(status: unknown): TagVariant {
    return STATUS_TONE[status as UserStatus] ?? 'default';
  }

  asUser(row: unknown): User {
    return row as User;
  }

  showError(form: MemberForm, name: keyof MemberForm['controls']): boolean {
    const control = form.controls[name];
    return control.invalid && control.touched;
  }

  errorFor(form: MemberForm, name: keyof MemberForm['controls'], label: string): string {
    const control = form.controls[name];
    if (control.hasError('required')) return `${label} is required`;
    if (control.hasError('email')) return 'Enter a valid email address';
    return '';
  }

  // --- Dialog openers -----------------------------------------------------

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
    this.dialog.set(null);
    this.saving.set(false);
  }

  /** The library modal emits `closed` for its own close button, backdrop and Escape. */
  onModalClosed(which: Dialog): void {
    if (this.dialog() === which) {
      this.closeDialog();
      if (which !== 'edit' && which !== 'details') {
        this.selected.set(null);
      }
    }
  }

  // --- Mutations ----------------------------------------------------------

  saveEdit(): void {
    const user = this.selected();
    if (!user) return;
    if (this.editForm.invalid) {
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
        this.closeDialog();
        this.selected.set(null);
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = `${firstName.trim()} ${lastName.trim()}`;
    const newUser: Omit<User, 'id'> = {
      name,
      email: email.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName.trim())}`,
      role: role as UserRole,
      status: 'Active',
      joinedDate: formatDate(new Date(), 'yyyy-MM-dd', 'en-US'),
    };
    this.saving.set(true);
    this.usersService.create(newUser).subscribe({
      next: () => {
        this.closeDialog();
        this.inviteForm.reset();
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
        this.closeDialog();
        this.selected.set(null);
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }
}
