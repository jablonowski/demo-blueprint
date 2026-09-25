import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  AvatarComponent,
  ButtonComponent,
  ColumnDefDirective,
  ModalComponent,
  TableComponent,
  TagComponent,
} from '@jablonowski/dsb-components';

import { User } from '../../core/user.model';
import { UsersService } from '../../core/users.service';
import { MemberFormFieldsComponent } from './member-form-fields.component';
import { MemberIdentityComponent } from './member-identity.component';
import { ROLE_VARIANT, STATUS_VARIANT, createMemberForm, joinName, splitName } from './member-form';

type Dialog = 'details' | 'edit' | 'invite' | 'delete' | null;

@Component({
  selector: 'app-users',
  imports: [
    ReactiveFormsModule,
    AvatarComponent,
    ButtonComponent,
    ColumnDefDirective,
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

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dialog = signal<Dialog>(null);
  readonly selected = signal<User | null>(null);

  readonly editForm = createMemberForm();
  readonly inviteForm = createMemberForm();

  readonly roleVariant = ROLE_VARIANT;
  readonly statusVariant = STATUS_VARIANT;
  readonly splitName = splitName;

  constructor() {
    this.load();
  }

  /** Table rows are untyped records; the cell templates read them back as users. */
  asUser(row: Record<string, unknown>): User {
    return row as unknown as User;
  }

  get rows(): Record<string, unknown>[] {
    return this.users() as unknown as Record<string, unknown>[];
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
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    this.selected.set(user);
    const { firstName, lastName } = splitName(user.name);
    this.editForm.reset({ firstName, lastName, email: user.email, role: user.role });
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
    this.selected.set(null);
  }

  saveEdit(): void {
    const user = this.selected();
    if (!user) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: joinName(firstName, lastName), email: email.trim(), role: role || user.role };
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
    const today = new Date();
    const joinedDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
    this.saving.set(true);
    this.usersService
      .create({
        name,
        email: email.trim(),
        role: role || 'Viewer',
        status: 'Active',
        joinedDate,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName.trim() || name)}`,
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
}
