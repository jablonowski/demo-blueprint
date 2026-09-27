import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ButtonComponent,
  ColumnDefDirective,
  DropdownComponent,
  DropdownOption,
  InputComponent,
  ModalComponent,
  TableComponent,
  TagComponent,
  TagVariant,
  AvatarComponent,
} from '@jablonowski/dsb-components';
import { User, UserRole, UserStatus } from '../../core/user.model';
import { UsersService } from '../../core/users.service';
import { MemberSummaryComponent } from './member-summary.component';

type Dialog = 'details' | 'edit' | 'invite' | 'delete' | null;

const ROLE_TAG: Record<UserRole, TagVariant> = {
  Admin: 'danger',
  Editor: 'info',
  Viewer: 'default',
};

const STATUS_TAG: Record<UserStatus, TagVariant> = {
  Active: 'success',
  Inactive: 'default',
};

@Component({
  selector: 'app-users',
  imports: [
    ReactiveFormsModule,
    TableComponent,
    ColumnDefDirective,
    ButtonComponent,
    TagComponent,
    AvatarComponent,
    ModalComponent,
    InputComponent,
    DropdownComponent,
    MemberSummaryComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dialog = signal<Dialog>(null);
  readonly selected = signal<User | null>(null);

  readonly roleOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  readonly editForm = this.memberForm();
  readonly inviteForm = this.memberForm();

  /** Read-only controls for the details dialog; disabled so dsb-input renders its disabled state. */
  readonly details = {
    firstName: new FormControl({ value: '', disabled: true }),
    lastName: new FormControl({ value: '', disabled: true }),
    email: new FormControl({ value: '', disabled: true }),
    role: new FormControl({ value: '', disabled: true }),
  };

  ngOnInit(): void {
    this.load();
  }

  rows(): Record<string, unknown>[] {
    return this.users() as unknown as Record<string, unknown>[];
  }

  asUser(row: Record<string, unknown>): User {
    return row as unknown as User;
  }

  roleTag(role: UserRole): TagVariant {
    return ROLE_TAG[role] ?? 'default';
  }

  statusTag(status: UserStatus): TagVariant {
    return STATUS_TAG[status] ?? 'default';
  }

  formatJoined(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  showError(form: ReturnType<UsersComponent['memberForm']>, name: 'firstName' | 'lastName' | 'email' | 'role'): boolean {
    const control = form.controls[name];
    return control.invalid && control.touched;
  }

  emailError(form: ReturnType<UsersComponent['memberForm']>): string {
    return form.controls.email.hasError('email') ? 'Enter a valid email address' : 'Email address is required';
  }

  openDetails(user: User): void {
    const [firstName, lastName] = this.splitName(user.name);
    this.details.firstName.setValue(firstName);
    this.details.lastName.setValue(lastName);
    this.details.email.setValue(user.email);
    this.details.role.setValue(user.role);
    this.selected.set(user);
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    const [firstName, lastName] = this.splitName(user.name);
    this.editForm.reset({ firstName, lastName, email: user.email, role: user.role });
    this.selected.set(user);
    this.dialog.set('edit');
  }

  openInvite(): void {
    this.inviteForm.reset({ firstName: '', lastName: '', email: '', role: '' });
    this.selected.set(null);
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

  /** dsb-modal emits (closed) for its own close button, Escape and backdrop clicks. */
  onModalClosed(which: Exclude<Dialog, null>): void {
    if (this.dialog() === which) {
      this.closeDialog();
    }
  }

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
    const updated: User = { ...user, name: this.joinName(firstName, lastName), email: email.trim(), role: role as UserRole };
    this.saving.set(true);
    this.usersService.update(user.id, updated).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeDialog();
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
    const name = this.joinName(firstName, lastName);
    const newUser: Omit<User, 'id'> = {
      name,
      email: email.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      role: role as UserRole,
      status: 'Active',
      joinedDate: this.today(),
    };
    this.saving.set(true);
    this.usersService.create(newUser).subscribe({
      next: () => {
        this.saving.set(false);
        this.inviteForm.reset({ firstName: '', lastName: '', email: '', role: '' });
        this.closeDialog();
        this.load();
      },
      error: () => this.saving.set(false),
    });
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
        this.closeDialog();
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.usersService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private memberForm() {
    return this.fb.nonNullable.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
    });
  }

  private splitName(name: string): [string, string] {
    const parts = name.trim().split(/\s+/);
    return [parts[0] ?? '', parts.slice(1).join(' ')];
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
