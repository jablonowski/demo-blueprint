import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

import { User, UserRole } from '../../core/user.model';
import { UsersService } from '../../core/users.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { BadgeComponent } from '../../shared/badge.component';
import { ModalComponent } from '../../shared/modal.component';
import { ROLE_TONE, STATUS_TONE, splitName } from '../../shared/user-tones';
import { MemberFormFieldsComponent } from './member-form-fields.component';
import { MemberSummaryComponent } from './member-summary.component';
import { MemberForm, createMemberForm } from './member-form';

type Dialog = 'details' | 'edit' | 'invite' | 'delete';

@Component({
  selector: 'app-users',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    AvatarComponent,
    BadgeComponent,
    ModalComponent,
    MemberFormFieldsComponent,
    MemberSummaryComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {
  private readonly usersService = inject(UsersService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly roleTone = ROLE_TONE;
  protected readonly statusTone = STATUS_TONE;

  protected readonly users = signal<User[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly dialog = signal<Dialog | null>(null);
  protected readonly selected = signal<User | null>(null);

  protected readonly editForm: MemberForm = createMemberForm(this.fb);
  protected readonly inviteForm: MemberForm = createMemberForm(this.fb);

  constructor() {
    this.reload();
  }

  protected splitName = splitName;

  openDetails(user: User): void {
    this.selected.set(user);
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    const { firstName, lastName } = splitName(user.name);
    this.editForm.reset({ firstName, lastName, email: user.email, role: user.role });
    this.selected.set(user);
    this.dialog.set('edit');
  }

  openInvite(): void {
    this.inviteForm.reset({ firstName: '', lastName: '', email: '', role: '' });
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
    if (this.saving()) return;
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
    const updated: User = {
      ...user,
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      role: role as UserRole,
    };
    this.run(this.usersService.update(user.id, updated));
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = `${firstName.trim()} ${lastName.trim()}`;
    this.run(
      this.usersService.create({
        name,
        email: email.trim(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        role: role as UserRole,
        status: 'Active',
        joinedDate: todayIso(),
      }),
      () => this.inviteForm.reset({ firstName: '', lastName: '', email: '', role: '' }),
    );
  }

  confirmDelete(): void {
    const user = this.selected();
    if (!user) return;
    this.run(this.usersService.delete(user.id));
  }

  /** Issue a mutation, then reload the list and close the dialog. */
  private run(request: Observable<unknown>, onSuccess?: () => void): void {
    this.saving.set(true);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        onSuccess?.();
        this.saving.set(false);
        this.close();
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        console.error('Request failed', err);
      },
    });
  }

  private reload(): void {
    this.usersService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((users) => {
        this.users.set(users);
        this.loading.set(false);
      });
  }
}

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
