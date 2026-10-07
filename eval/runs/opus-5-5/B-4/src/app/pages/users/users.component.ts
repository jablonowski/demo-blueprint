import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  AvatarComponent,
  ButtonComponent,
  ColumnDefDirective,
  InputComponent,
  ModalComponent,
  TableComponent,
  TagComponent,
  TagVariant,
} from '@jablonowski/dsb-components';
import { Observable, finalize, switchMap, tap } from 'rxjs';

import { User, UserRole, UserStatus } from '../../core/user.model';
import { UsersService } from '../../core/users.service';
import { createMemberForm, joinName, memberFormValue } from './member-form';
import { MemberFieldsComponent } from './member-fields.component';
import { MemberIdentityComponent } from './member-identity.component';

type Dialog = 'details' | 'edit' | 'invite' | 'delete';

const ROLE_TONE: Record<UserRole, TagVariant> = { Admin: 'danger', Editor: 'info', Viewer: 'default' };
const STATUS_TONE: Record<UserStatus, TagVariant> = { Active: 'success', Inactive: 'default' };

@Component({
  selector: 'app-users',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TableComponent,
    ColumnDefDirective,
    AvatarComponent,
    TagComponent,
    ButtonComponent,
    ModalComponent,
    InputComponent,
    MemberFieldsComponent,
    MemberIdentityComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly destroyRef = inject(DestroyRef);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly selected = signal<User | null>(null);
  readonly dialog = signal<Dialog | null>(null);
  readonly submitted = signal(false);

  /** Avatar URLs that failed to load; those rows fall back to initials. */
  private readonly brokenAvatars = signal<ReadonlySet<string>>(new Set());

  readonly rows = computed(() => this.users() as unknown as Record<string, unknown>[]);

  readonly editForm = createMemberForm();
  readonly inviteForm = createMemberForm();

  /** Read-only mirror of the selected member for the details dialog. */
  readonly detailsForm = new FormGroup({
    firstName: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    lastName: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    email: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    role: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.reload().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

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

  // ----- dialogs ---------------------------------------------------------------------------

  openDetails(user: User): void {
    this.selected.set(user);
    this.detailsForm.setValue(memberFormValue(user));
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    this.selected.set(user);
    this.submitted.set(false);
    this.editForm.reset(memberFormValue(user));
    this.dialog.set('edit');
  }

  openInvite(): void {
    this.selected.set(null);
    this.submitted.set(false);
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

  /** Bound to each modal's openChange: the modal closed itself (✕, backdrop or Escape). */
  onModalOpenChange(open: boolean): void {
    if (!open) {
      this.closeDialog();
    }
  }

  // ----- CRUD ------------------------------------------------------------------------------

  saveEdit(): void {
    const user = this.selected();
    this.submitted.set(true);
    if (!user || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: joinName(firstName, lastName), email: email.trim(), role: role as UserRole };
    this.run(this.usersService.update(user.id, updated), () => this.closeDialog());
  }

  sendInvite(): void {
    this.submitted.set(true);
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = joinName(firstName, lastName);
    const newUser: Omit<User, 'id'> = {
      name,
      email: email.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      role: role as UserRole,
      status: 'Active',
      joinedDate: todayIso(),
    };
    this.run(this.usersService.create(newUser), () => {
      this.inviteForm.reset();
      this.submitted.set(false);
      this.closeDialog();
    });
  }

  confirmDelete(): void {
    const user = this.selected();
    if (!user) {
      return;
    }
    this.run(this.usersService.delete(user.id), () => {
      this.closeDialog();
      this.selected.set(null);
    });
  }

  /** Issue a mutation, reload the table, then run `done`. */
  private run(request: Observable<unknown>, done: () => void): void {
    this.saving.set(true);
    request
      .pipe(
        switchMap(() => this.reload()),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: done, error: (err) => console.warn('Request failed', err) });
  }

  private reload(): Observable<User[]> {
    this.loading.set(this.users().length === 0);
    return this.usersService.getAll().pipe(
      tap((users) => {
        this.users.set(users);
        this.checkAvatars(users);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  /** The avatar component only falls back when `src` is empty, so probe each URL once. */
  private checkAvatars(users: User[]): void {
    for (const { avatar } of users) {
      if (!avatar || this.brokenAvatars().has(avatar)) {
        continue;
      }
      const probe = new Image();
      probe.onerror = () => this.brokenAvatars.update((set) => new Set(set).add(avatar));
      probe.src = avatar;
    }
  }
}

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
