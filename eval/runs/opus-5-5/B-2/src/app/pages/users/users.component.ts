import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
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
import { Observable } from 'rxjs';

import { User, UserRole, UserStatus } from '../../core/user.model';
import { UsersService } from '../../core/users.service';
import { MemberFormFieldsComponent } from './member-form-fields.component';
import { MemberIdentityComponent } from './member-identity.component';
import { createMemberForm, joinName, splitName } from './member-form';

type Dialog = 'details' | 'edit' | 'invite' | 'delete';

const ROLE_TONE: Record<UserRole, TagVariant> = {
  Admin: 'danger',
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
    ReactiveFormsModule,
    AvatarComponent,
    ButtonComponent,
    ColumnDefDirective,
    InputComponent,
    ModalComponent,
    TableComponent,
    TagComponent,
    MemberFormFieldsComponent,
    MemberIdentityComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dialog = signal<Dialog | null>(null);
  readonly selected = signal<User | null>(null);

  /** The table works on loose records; the templates below cast rows back with `asUser`. */
  readonly rows = computed(() => this.users() as unknown as Record<string, unknown>[]);

  readonly editForm = createMemberForm(this.fb);
  readonly inviteForm = createMemberForm(this.fb);

  /** Backs the read-only fields of the details dialog; every control is disabled. */
  readonly detailsForm = this.fb.group({
    firstName: [{ value: '', disabled: true }],
    lastName: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
    role: [{ value: '', disabled: true }],
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

  openDelete(user: User): void {
    this.selected.set(user);
    this.dialog.set('delete');
  }

  openInvite(): void {
    this.selected.set(null);
    this.inviteForm.reset();
    this.dialog.set('invite');
  }

  /** From the edit dialog: swap to the delete confirmation, keeping the selection. */
  editToDelete(): void {
    this.dialog.set('delete');
  }

  closeDialog(): void {
    this.dialog.set(null);
    this.selected.set(null);
  }

  saveEdit(): void {
    const user = this.selected();
    this.editForm.markAllAsTouched();
    if (!user || this.editForm.invalid) {
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: joinName(firstName, lastName), email, role: role as UserRole };
    this.persist(this.usersService.update(user.id, updated));
  }

  sendInvite(): void {
    this.inviteForm.markAllAsTouched();
    if (this.inviteForm.invalid) {
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = joinName(firstName, lastName);
    this.persist(
      this.usersService.create({
        name,
        email,
        role: role as UserRole,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        status: 'Active',
        joinedDate: this.today(),
      }),
      () => this.inviteForm.reset(),
    );
  }

  confirmDelete(): void {
    const user = this.selected();
    if (user) {
      this.persist(this.usersService.delete(user.id));
    }
  }

  private persist(request: Observable<unknown>, after?: () => void): void {
    this.saving.set(true);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        after?.();
        this.closeDialog();
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  private today(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}
