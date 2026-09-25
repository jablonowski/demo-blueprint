import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
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
import { UsersService } from '../../core/users.service';
import { User, UserRole, UserStatus } from '../../core/user.model';

type Dialog = 'none' | 'details' | 'edit' | 'invite' | 'delete';

const ROLE_TONE: Record<UserRole, TagVariant> = {
  Admin: 'primary',
  Editor: 'info',
  Viewer: 'default',
};

const STATUS_TONE: Record<UserStatus, TagVariant> = {
  Active: 'success',
  Inactive: 'default',
};

@Component({
  selector: 'app-users',
  imports: [
    DatePipe,
    NgTemplateOutlet,
    ReactiveFormsModule,
    TableComponent,
    ColumnDefDirective,
    AvatarComponent,
    TagComponent,
    ButtonComponent,
    ModalComponent,
    InputComponent,
    DropdownComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dialog = signal<Dialog>('none');
  readonly selected = signal<User | null>(null);

  /** Avatar URLs that failed to load; those rows fall back to initials. */
  private readonly brokenAvatars = signal<ReadonlySet<string>>(new Set());

  readonly rows = computed(() => this.users() as unknown as Record<string, unknown>[]);

  readonly roleOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  readonly editForm = this.memberForm();
  readonly inviteForm = this.memberForm();

  readonly detailsForm = this.fb.nonNullable.group({
    firstName: [{ value: '', disabled: true }],
    lastName: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
    role: [{ value: '', disabled: true }],
  });

  constructor() {
    this.load();
  }

  // ---- data --------------------------------------------------------------

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

  // ---- template helpers --------------------------------------------------

  asUser(row: Record<string, unknown>): User {
    return row as unknown as User;
  }

  avatarSrc(user: User): string {
    return this.brokenAvatars().has(user.avatar) ? '' : user.avatar;
  }

  roleTone(role: UserRole): TagVariant {
    return ROLE_TONE[role] ?? 'default';
  }

  statusTone(status: UserStatus): TagVariant {
    return STATUS_TONE[status] ?? 'default';
  }

  showError(form: ReturnType<UsersComponent['memberForm']>, field: 'firstName' | 'lastName' | 'email' | 'role'): boolean {
    const control = form.controls[field];
    return control.invalid && control.touched;
  }

  emailError(form: ReturnType<UsersComponent['memberForm']>): string {
    return form.controls.email.hasError('email') ? 'Enter a valid email address' : 'Email address is required';
  }

  // ---- dialogs -----------------------------------------------------------

  openDetails(user: User): void {
    this.selected.set(user);
    const { firstName, lastName } = splitName(user.name);
    this.detailsForm.setValue({ firstName, lastName, email: user.email, role: user.role });
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    this.selected.set(user);
    const { firstName, lastName } = splitName(user.name);
    this.editForm.reset({ firstName, lastName, email: user.email, role: user.role });
    this.dialog.set('edit');
  }

  openInvite(): void {
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

  // ---- mutations ---------------------------------------------------------

  saveEdit(): void {
    const user = this.selected();
    if (!user) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: joinName(firstName, lastName), email: email.trim(), role: role as UserRole };
    this.run(this.usersService.update(user.id, updated));
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = joinName(firstName, lastName);
    this.run(
      this.usersService.create({
        name,
        email: email.trim(),
        role: role as UserRole,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        status: 'Active',
        joinedDate: today(),
      }),
      () => this.inviteForm.reset(),
    );
  }

  confirmDelete(): void {
    const user = this.selected();
    if (!user) return;
    this.run(this.usersService.delete(user.id));
  }

  private run(request: Observable<unknown>, after?: () => void): void {
    this.saving.set(true);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeDialog();
        after?.();
        this.load();
      },
      error: () => this.saving.set(false),
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

  private probeAvatars(users: User[]): void {
    for (const { avatar } of users) {
      if (!avatar || this.brokenAvatars().has(avatar)) continue;
      const img = new Image();
      img.onerror = () => this.brokenAvatars.update((set) => new Set(set).add(avatar));
      img.src = avatar;
    }
  }
}

function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

function joinName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
