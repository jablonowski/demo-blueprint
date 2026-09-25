import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { ROLE_TAG, STATUS_TAG, User, UserRole, splitName } from '../../core/user.model';
import { UsersService } from '../../core/users.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { buildMemberForm } from './dialogs/member-form';
import { MemberFormFieldsComponent } from './dialogs/member-form-fields.component';
import { MemberSummaryComponent } from './dialogs/member-summary.component';

type DialogKind = 'delete' | 'details' | 'edit' | 'invite';

@Component({
  selector: 'app-users',
  imports: [DatePipe, AvatarComponent, ModalComponent, MemberFormFieldsComponent, MemberSummaryComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css', './dialogs/dialogs.css'],
})
export class UsersComponent implements OnInit {
  private readonly users = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly roleTag = ROLE_TAG;
  readonly statusTag = STATUS_TAG;

  readonly list = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dialog = signal<DialogKind | null>(null);
  readonly selected = signal<User | null>(null);
  readonly submitted = signal(false);

  readonly editForm = buildMemberForm(this.fb);
  readonly inviteForm = buildMemberForm(this.fb);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.users.getAll().subscribe((users) => {
      this.list.set(users);
      this.loading.set(false);
    });
  }

  firstName(user: User): string {
    return splitName(user.name).firstName;
  }

  lastName(user: User): string {
    return splitName(user.name).lastName;
  }

  openDetails(user: User): void {
    this.selected.set(user);
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    this.selected.set(user);
    this.submitted.set(false);
    this.editForm.reset({ ...splitName(user.name), email: user.email, role: user.role });
    this.dialog.set('edit');
  }

  openDelete(user: User): void {
    this.selected.set(user);
    this.dialog.set('delete');
  }

  openInvite(): void {
    this.selected.set(null);
    this.submitted.set(false);
    this.inviteForm.reset();
    this.dialog.set('invite');
  }

  /** From the edit dialog: swap to the delete confirmation, keeping the selection. */
  editToDelete(): void {
    this.dialog.set('delete');
  }

  close(): void {
    this.dialog.set(null);
    this.selected.set(null);
  }

  confirmDelete(): void {
    const user = this.selected();
    if (!user) return;
    this.saving.set(true);
    this.users.delete(user.id).subscribe(() => {
      this.saving.set(false);
      this.reload();
      this.close();
    });
  }

  saveEdit(): void {
    const user = this.selected();
    this.submitted.set(true);
    if (!user || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: `${firstName.trim()} ${lastName.trim()}`, email, role: role as UserRole };
    this.saving.set(true);
    this.users.update(user.id, updated).subscribe(() => {
      this.saving.set(false);
      this.reload();
      this.close();
    });
  }

  sendInvite(): void {
    this.submitted.set(true);
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = `${firstName.trim()} ${lastName.trim()}`;
    this.saving.set(true);
    this.users
      .create({
        name,
        email,
        role: role as UserRole,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName.trim())}`,
        status: 'Active',
        joinedDate: today(),
      })
      .subscribe(() => {
        this.saving.set(false);
        this.reload();
        this.inviteForm.reset();
        this.close();
      });
  }
}

function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
