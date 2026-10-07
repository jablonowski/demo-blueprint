import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { Role, User } from '../../core/user.model';
import { UsersService } from '../../core/users.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { BadgeComponent } from '../../shared/badge.component';
import { DialogComponent } from '../../shared/dialog.component';
import { ROLE_TONE, STATUS_TONE } from '../../shared/tones';
import { createMemberForm, joinName, splitName } from './member-form';
import { MemberFieldsComponent } from './member-fields.component';
import { MemberSummaryComponent } from './member-summary.component';

type DialogKind = 'details' | 'edit' | 'invite' | 'delete';

@Component({
  selector: 'app-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    AvatarComponent,
    BadgeComponent,
    DialogComponent,
    MemberFieldsComponent,
    MemberSummaryComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent {
  private readonly usersService = inject(UsersService);

  readonly roleTone = ROLE_TONE;
  readonly statusTone = STATUS_TONE;

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dialog = signal<DialogKind | null>(null);
  readonly selected = signal<User | null>(null);
  readonly selectedName = computed(() => splitName(this.selected()?.name ?? ''));

  readonly editForm = createMemberForm();
  readonly inviteForm = createMemberForm();

  constructor() {
    this.load();
  }

  load(): void {
    this.usersService.getAll().subscribe((users) => {
      this.users.set(users);
      this.loading.set(false);
    });
  }

  // ---------- Opening / closing ----------

  openDetails(user: User): void {
    this.selected.set(user);
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    const { first, last } = splitName(user.name);
    this.editForm.reset({ firstName: first, lastName: last, email: user.email, role: user.role });
    this.selected.set(user);
    this.dialog.set('edit');
  }

  openInvite(): void {
    this.inviteForm.reset();
    this.selected.set(null);
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
    this.dialog.set(null);
    this.selected.set(null);
  }

  // ---------- Mutations ----------

  save(): void {
    const user = this.selected();
    if (!user || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: joinName(firstName, lastName), email: email.trim(), role: role as Role };
    this.mutate(this.usersService.update(user.id, updated));
  }

  invite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = joinName(firstName, lastName);
    this.mutate(
      this.usersService.create({
        name,
        email: email.trim(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        role: role as Role,
        status: 'Active',
        joinedDate: toIsoDate(new Date()),
      }),
      () => this.inviteForm.reset(),
    );
  }

  confirmDelete(): void {
    const user = this.selected();
    if (user) {
      this.mutate(this.usersService.delete(user.id));
    }
  }

  private mutate(request: Observable<unknown>, after?: () => void): void {
    this.saving.set(true);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.close();
        after?.();
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }
}

function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
