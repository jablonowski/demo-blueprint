import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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

type Dialog = 'none' | 'details' | 'edit' | 'delete' | 'invite';

function memberForm() {
  return new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl<UserRole | ''>('', { nonNullable: true, validators: [Validators.required] }),
  });
}
type MemberForm = ReturnType<typeof memberForm>;

@Component({
  selector: 'app-users',
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
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

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dialog = signal<Dialog>('none');
  readonly selected = signal<User | null>(null);
  /** Avatar URLs that failed to load; dsb-avatar only shows initials when src is empty. */
  private readonly failedAvatars = signal<ReadonlySet<string>>(new Set());

  readonly roleOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  readonly editForm = memberForm();
  readonly inviteForm = memberForm();

  /** Read-only view of the selected member, rendered through disabled dsb-inputs. */
  readonly detailsForm = new FormGroup({
    firstName: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    lastName: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    email: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    role: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.usersService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
        users.forEach((u) => this.probeAvatar(u.avatar));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  avatarSrc(user: User): string {
    return this.failedAvatars().has(user.avatar) ? '' : user.avatar;
  }

  private probeAvatar(url: string): void {
    if (!url || this.failedAvatars().has(url)) return;
    const img = new Image();
    img.onerror = () => this.failedAvatars.update((s) => new Set(s).add(url));
    img.src = url;
  }

  roleVariant(role: UserRole): TagVariant {
    return role === 'Admin' ? 'primary' : role === 'Editor' ? 'info' : 'default';
  }

  statusVariant(status: UserStatus): TagVariant {
    return status === 'Active' ? 'success' : 'default';
  }

  memberSince(date: string): string {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  asUser(row: Record<string, unknown>): User {
    return row as unknown as User;
  }

  showError(form: MemberForm, name: keyof MemberForm['controls']): boolean {
    const control = form.controls[name];
    return control.invalid && control.touched;
  }

  emailError(form: MemberForm): string {
    return form.controls.email.hasError('email') ? 'Enter a valid email address' : 'Email address is required';
  }

  // --- dialogs ---------------------------------------------------------------

  openDetails(user: User): void {
    const [firstName, lastName] = splitName(user.name);
    this.detailsForm.setValue({ firstName, lastName, email: user.email, role: user.role });
    this.selected.set(user);
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    const [firstName, lastName] = splitName(user.name);
    this.editForm.reset({ firstName, lastName, email: user.email, role: user.role });
    this.selected.set(user);
    this.dialog.set('edit');
  }

  openDelete(user: User): void {
    this.selected.set(user);
    this.dialog.set('delete');
  }

  openInvite(): void {
    this.inviteForm.reset();
    this.selected.set(null);
    this.dialog.set('invite');
  }

  /** Hands over from edit to delete confirmation, keeping the selection. */
  editToDelete(): void {
    this.dialog.set('delete');
  }

  closeDialog(): void {
    this.dialog.set('none');
    this.selected.set(null);
  }

  /** Only react to a modal's close if it is still the active one. */
  onModalClosed(which: Dialog): void {
    if (this.dialog() === which) this.closeDialog();
  }

  // --- mutations -------------------------------------------------------------

  confirmDelete(): void {
    const user = this.selected();
    if (!user) return;
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

  saveEdit(): void {
    const user = this.selected();
    if (!user) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: joinName(firstName, lastName), email: email.trim(), role: role as UserRole };
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
    const name = joinName(firstName, lastName);
    this.saving.set(true);
    this.usersService
      .create({
        name,
        email: email.trim(),
        role: role as UserRole,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName.trim() || name)}`,
        status: 'Active',
        joinedDate: today(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.inviteForm.reset();
          this.closeDialog();
          this.load();
        },
        error: () => this.saving.set(false),
      });
  }
}

function splitName(name: string): [string, string] {
  const parts = name.trim().split(/\s+/);
  return [parts[0] ?? '', parts.slice(1).join(' ')];
}

function joinName(first: string, last: string): string {
  return `${first.trim()} ${last.trim()}`.trim();
}

function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
