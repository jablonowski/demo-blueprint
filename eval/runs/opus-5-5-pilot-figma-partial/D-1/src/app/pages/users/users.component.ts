import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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

const ROLE_TONE: Record<UserRole, TagVariant> = { Admin: 'primary', Editor: 'info', Viewer: 'default' };
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
export class UsersComponent implements AfterViewInit {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dialog = signal<Dialog | null>(null);
  readonly selected = signal<User | null>(null);
  /** Rows whose avatar image failed to load; they fall back to initials. */
  readonly brokenAvatars = signal<ReadonlySet<number>>(new Set());

  readonly roleOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  readonly editForm = this.memberForm();
  readonly inviteForm = this.memberForm();
  readonly editSubmitted = signal(false);
  readonly inviteSubmitted = signal(false);

  /** Read-only mirror of the member, rendered through disabled inputs. */
  readonly detailsForm = this.fb.group({
    firstName: [{ value: '', disabled: true }],
    lastName: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
    role: [{ value: '', disabled: true }],
  });

  constructor() {
    this.load();
  }

  ngAfterViewInit(): void {
    // dsb-avatar renders a plain <img>; image errors do not bubble, so listen in capture.
    const el = this.host.nativeElement as HTMLElement;
    const onError = (event: Event) => {
      const cell = (event.target as HTMLElement).closest<HTMLElement>('[data-avatar-id]');
      if (cell) {
        const id = Number(cell.dataset['avatarId']);
        this.brokenAvatars.update((ids) => new Set(ids).add(id));
      }
    };
    el.addEventListener('error', onError, true);
    this.destroyRef.onDestroy(() => el.removeEventListener('error', onError, true));
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

  asUser(row: unknown): User {
    return row as User;
  }

  avatarSrc(user: User): string {
    return this.brokenAvatars().has(user.id) ? '' : user.avatar;
  }

  roleTone(role: UserRole): TagVariant {
    return ROLE_TONE[role] ?? 'default';
  }

  statusTone(status: UserStatus): TagVariant {
    return STATUS_TONE[status] ?? 'default';
  }

  /** Parses YYYY-MM-DD as a local date, so the month never shifts across time zones. */
  joined(user: User): Date {
    const [y, m, d] = user.joinedDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  showError(form: 'edit' | 'invite', field: 'firstName' | 'lastName' | 'email' | 'role'): boolean {
    const group = form === 'edit' ? this.editForm : this.inviteForm;
    const submitted = form === 'edit' ? this.editSubmitted() : this.inviteSubmitted();
    const control = group.controls[field];
    return control.invalid && (control.touched || submitted);
  }

  emailError(form: 'edit' | 'invite'): string {
    const group = form === 'edit' ? this.editForm : this.inviteForm;
    return group.controls.email.hasError('required') ? 'Email address is required' : 'Enter a valid email address';
  }

  openDetails(user: User): void {
    const { firstName, lastName } = this.splitName(user.name);
    this.detailsForm.setValue({ firstName, lastName, email: user.email, role: user.role });
    this.selected.set(user);
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    const { firstName, lastName } = this.splitName(user.name);
    this.editForm.reset({ firstName, lastName, email: user.email, role: user.role });
    this.editSubmitted.set(false);
    this.selected.set(user);
    this.dialog.set('edit');
  }

  openInvite(): void {
    this.inviteForm.reset();
    this.inviteSubmitted.set(false);
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
  }

  saveEdit(): void {
    const user = this.selected();
    this.editSubmitted.set(true);
    if (!user || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: this.joinName(firstName, lastName), email: email.trim(), role: role as UserRole };
    this.saving.set(true);
    this.usersService.update(user.id, updated).subscribe({
      next: () => {
        this.saving.set(false);
        this.selected.set(updated);
        this.closeDialog();
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  sendInvite(): void {
    this.inviteSubmitted.set(true);
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = this.joinName(firstName, lastName);
    this.saving.set(true);
    this.usersService
      .create({
        name,
        email: email.trim(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName.trim())}`,
        role: role as UserRole,
        status: 'Active',
        joinedDate: this.today(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.closeDialog();
          this.inviteForm.reset();
          this.inviteSubmitted.set(false);
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
        this.load();
        this.closeDialog();
        this.selected.set(null);
      },
      error: () => this.saving.set(false),
    });
  }

  private memberForm() {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
    });
  }

  private splitName(name: string): { firstName: string; lastName: string } {
    const parts = name.trim().split(/\s+/);
    return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
  }

  private joinName(firstName: string, lastName: string): string {
    return `${firstName.trim()} ${lastName.trim()}`.trim();
  }

  private today(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}
