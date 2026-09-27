import { Component, DestroyRef, ElementRef, OnInit, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
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

const ROLE_TONE: Record<UserRole, TagVariant> = {
  Admin: 'danger',
  Editor: 'info',
  Viewer: 'default',
};

const STATUS_TONE: Record<UserStatus, TagVariant> = {
  Active: 'success',
  Inactive: 'default',
};

/** Parses a `yyyy-mm-dd` string as a local calendar date, so no timezone shifts the day. */
function parseDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function splitName(name: string): { first: string; last: string } {
  const [first = '', ...rest] = name.trim().split(/\s+/);
  return { first, last: rest.join(' ') };
}

function buildMemberForm(): MemberForm {
  return new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl<UserRole | ''>('', { nonNullable: true, validators: [Validators.required] }),
  });
}

@Component({
  selector: 'app-users',
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
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
  private readonly tableHost = viewChild.required<ElementRef<HTMLElement>>('tableHost');

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly selected = signal<User | null>(null);
  readonly brokenAvatars = signal<ReadonlySet<string>>(new Set());

  readonly rows = computed(() => this.users() as unknown as Record<string, unknown>[]);

  readonly deleteOpen = signal(false);
  readonly detailsOpen = signal(false);
  readonly editOpen = signal(false);
  readonly inviteOpen = signal(false);

  readonly editSubmitted = signal(false);
  readonly inviteSubmitted = signal(false);
  readonly saving = signal(false);

  readonly roleOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  readonly editForm = buildMemberForm();
  readonly inviteForm = buildMemberForm();

  /** Read-only mirror of the selected member for the details dialog. */
  readonly detailsForm = new FormGroup({
    firstName: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    lastName: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    email: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    role: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
  });

  constructor() {
    // Image error events do not bubble, so they are caught in the capture phase.
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.tableHost().nativeElement;
      const handler = (event: Event) => this.onImageError(event);
      el.addEventListener('error', handler, true);
      destroyRef.onDestroy(() => el.removeEventListener('error', handler, true));
    });
  }

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

  avatarSrc(user: User): string {
    return this.brokenAvatars().has(user.avatar) ? '' : user.avatar;
  }

  /** dsb-avatar only falls back to initials for an empty src, so failed loads are tracked here. */
  onImageError(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLImageElement) {
      const src = target.getAttribute('src') ?? '';
      this.brokenAvatars.update((set) => new Set(set).add(src));
    }
  }

  roleTone(role: UserRole): TagVariant {
    return ROLE_TONE[role] ?? 'default';
  }

  statusTone(status: UserStatus): TagVariant {
    return STATUS_TONE[status] ?? 'default';
  }

  joinedShort(date: string): string {
    return parseDate(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  memberSince(date: string): string {
    return parseDate(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  showError(form: MemberForm, name: keyof MemberForm['controls'], submitted: boolean): boolean {
    const control = form.controls[name];
    return control.invalid && (control.touched || submitted);
  }

  emailError(form: MemberForm): string {
    return form.controls.email.hasError('required') ? 'Email address is required' : 'Enter a valid email address';
  }

  // Details -----------------------------------------------------------------

  openDetails(user: User): void {
    const { first, last } = splitName(user.name);
    this.selected.set(user);
    this.detailsForm.setValue({ firstName: first, lastName: last, email: user.email, role: user.role });
    this.detailsOpen.set(true);
  }

  closeDetails(): void {
    this.detailsOpen.set(false);
    this.selected.set(null);
  }

  // Edit --------------------------------------------------------------------

  openEdit(user: User): void {
    const { first, last } = splitName(user.name);
    this.selected.set(user);
    this.editSubmitted.set(false);
    this.editForm.reset({ firstName: first, lastName: last, email: user.email, role: user.role });
    this.editOpen.set(true);
  }

  closeEdit(): void {
    this.editOpen.set(false);
    this.selected.set(null);
  }

  saveEdit(): void {
    const user = this.selected();
    this.editSubmitted.set(true);
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
        this.closeEdit();
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  /** Hands over from the edit dialog to the delete confirmation, keeping the selection. */
  deleteFromEdit(): void {
    this.editOpen.set(false);
    this.deleteOpen.set(true);
  }

  // Delete ------------------------------------------------------------------

  openDelete(user: User): void {
    this.selected.set(user);
    this.deleteOpen.set(true);
  }

  closeDelete(): void {
    this.deleteOpen.set(false);
    this.selected.set(null);
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
        this.closeDelete();
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  // Invite ------------------------------------------------------------------

  openInvite(): void {
    this.inviteSubmitted.set(false);
    this.inviteForm.reset();
    this.inviteOpen.set(true);
  }

  closeInvite(): void {
    this.inviteOpen.set(false);
  }

  sendInvite(): void {
    this.inviteSubmitted.set(true);
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const first = firstName.trim();
    const last = lastName.trim();
    const member: Omit<User, 'id'> = {
      name: `${first} ${last}`.trim(),
      email: email.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(first || last)}`,
      role: role as UserRole,
      status: 'Active',
      joinedDate: todayIso(),
    };
    this.saving.set(true);
    this.usersService.create(member).subscribe({
      next: () => {
        this.saving.set(false);
        this.inviteForm.reset();
        this.inviteSubmitted.set(false);
        this.inviteOpen.set(false);
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }
}
