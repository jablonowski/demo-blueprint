import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
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

type Dialog = 'details' | 'edit' | 'invite' | 'delete';

const ROLE_TONE: Record<UserRole, TagVariant> = { Admin: 'danger', Editor: 'info', Viewer: 'default' };
const STATUS_TONE: Record<UserStatus, TagVariant> = { Active: 'success', Inactive: 'default' };

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
export class UsersComponent {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly rows = computed(() => this.users() as unknown as Record<string, unknown>[]);

  readonly dialog = signal<Dialog | null>(null);
  readonly selected = signal<User | null>(null);
  readonly saving = signal(false);
  readonly submitted = signal(false);

  readonly roleOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  readonly memberForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
  });

  /** Read-only mirror for the details dialog; disabled controls render as disabled fields. */
  readonly detailsForm = this.fb.group({
    firstName: new FormControl({ value: '', disabled: true }),
    lastName: new FormControl({ value: '', disabled: true }),
    email: new FormControl({ value: '', disabled: true }),
    role: new FormControl({ value: '', disabled: true }),
  });

  constructor() {
    this.load();
  }

  asUser(row: Record<string, unknown>): User {
    return row as unknown as User;
  }

  roleTone(role: UserRole): TagVariant {
    return ROLE_TONE[role] ?? 'default';
  }

  statusTone(status: UserStatus): TagVariant {
    return STATUS_TONE[status] ?? 'default';
  }

  /** Seed dates are calendar dates; parse them locally so the month never shifts with the time zone. */
  toDate(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  showError(name: keyof typeof this.memberForm.controls): boolean {
    const control = this.memberForm.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  errorFor(name: keyof typeof this.memberForm.controls, label: string): string {
    return this.memberForm.controls[name].hasError('email') ? 'Enter a valid email address' : `${label} is required`;
  }

  openDetails(user: User): void {
    const { firstName, lastName } = splitName(user.name);
    this.detailsForm.setValue({ firstName, lastName, email: user.email, role: user.role });
    this.open('details', user);
  }

  openEdit(user: User): void {
    const { firstName, lastName } = splitName(user.name);
    this.resetForm({ firstName, lastName, email: user.email, role: user.role });
    this.open('edit', user);
  }

  openInvite(): void {
    this.resetForm();
    this.open('invite', null);
  }

  openDelete(user: User): void {
    this.open('delete', user);
  }

  /** From the edit dialog: swap to the confirmation, keeping the selection. */
  requestDeleteFromEdit(): void {
    this.dialog.set('delete');
  }

  closeDialog(): void {
    this.dialog.set(null);
    this.selected.set(null);
    this.saving.set(false);
  }

  onModalClosed(which: Dialog): void {
    // Ignore the close event of a dialog that has already been swapped for another.
    if (this.dialog() === which) this.closeDialog();
  }

  saveEdit(): void {
    const user = this.selected();
    if (!user || !this.validate()) return;
    const { firstName, lastName, email, role } = this.memberForm.getRawValue();
    const updated: User = { ...user, name: joinName(firstName, lastName), email: email.trim(), role: role as UserRole };
    this.saving.set(true);
    this.usersService.update(user.id, updated).subscribe({
      next: () => this.afterMutation(),
      error: () => this.saving.set(false),
    });
  }

  sendInvite(): void {
    if (!this.validate()) return;
    const { firstName, lastName, email, role } = this.memberForm.getRawValue();
    const name = joinName(firstName, lastName);
    this.saving.set(true);
    this.usersService
      .create({
        name,
        email: email.trim(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        role: role as UserRole,
        status: 'Active',
        joinedDate: todayIso(),
      })
      .subscribe({
        next: () => {
          this.resetForm();
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

  private open(dialog: Dialog, user: User | null): void {
    this.selected.set(user);
    this.dialog.set(dialog);
  }

  private validate(): boolean {
    this.submitted.set(true);
    this.memberForm.markAllAsTouched();
    return this.memberForm.valid;
  }

  private resetForm(value = { firstName: '', lastName: '', email: '', role: '' }): void {
    this.memberForm.reset(value);
    this.submitted.set(false);
  }

  private afterMutation(): void {
    this.closeDialog();
    this.load();
  }

  private load(): void {
    this.loading.set(this.users().length === 0);
    this.usersService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

function joinName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
