import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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

type Dialog = 'none' | 'details' | 'edit' | 'invite' | 'delete';

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

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dialog = signal<Dialog>('none');
  readonly selected = signal<User | null>(null);

  readonly roleOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  readonly editForm = this.memberForm();
  readonly inviteForm = this.memberForm();

  /** Read-only mirror of the selected member for the details dialog. */
  readonly detailsForm = this.memberForm();

  ngOnInit(): void {
    this.detailsForm.disable();
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
    return ROLE_VARIANT[role] ?? 'default';
  }

  statusVariant(status: UserStatus): TagVariant {
    return STATUS_VARIANT[status] ?? 'default';
  }

  hasError(form: FormGroup, name: string): boolean {
    const control = form.get(name);
    return !!control && control.invalid && control.touched;
  }

  emailError(form: FormGroup): string {
    return form.get('email')?.hasError('email') ? 'Enter a valid email address' : 'Email address is required';
  }

  // ── Dialog openers ────────────────────────────────────────────────────────

  openDetails(user: User): void {
    this.selected.set(user);
    this.detailsForm.reset({ ...this.splitName(user.name), email: user.email, role: user.role });
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    this.selected.set(user);
    this.editForm.reset({ ...this.splitName(user.name), email: user.email, role: user.role });
    this.dialog.set('edit');
  }

  openInvite(): void {
    this.inviteForm.reset({ firstName: '', lastName: '', email: '', role: '' });
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

  close(): void {
    this.dialog.set('none');
    this.selected.set(null);
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  save(): void {
    const user = this.selected();
    if (!user) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = {
      ...user,
      name: this.joinName(firstName, lastName),
      email: email.trim(),
      role: role as UserRole,
    };
    this.saving.set(true);
    this.usersService.update(user.id, updated).subscribe({
      next: () => {
        this.saving.set(false);
        this.close();
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  invite(): void {
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
      joinedDate: new Date().toISOString().slice(0, 10),
    };
    this.saving.set(true);
    this.usersService.create(newUser).subscribe({
      next: () => {
        this.saving.set(false);
        this.inviteForm.reset({ firstName: '', lastName: '', email: '', role: '' });
        this.close();
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
        this.close();
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private memberForm() {
    return this.fb.nonNullable.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
    });
  }

  private splitName(name: string): { firstName: string; lastName: string } {
    const [firstName = '', ...rest] = name.trim().split(/\s+/);
    return { firstName, lastName: rest.join(' ') };
  }

  private joinName(firstName: string, lastName: string): string {
    return `${firstName.trim()} ${lastName.trim()}`.trim();
  }
}
