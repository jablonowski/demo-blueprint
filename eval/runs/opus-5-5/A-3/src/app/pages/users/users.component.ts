import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { Observable, finalize } from 'rxjs';
import { User, UserRole } from '../../core/user.model';
import { UsersService } from '../../core/users.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { BadgeComponent } from '../../shared/badge.component';
import { DialogComponent } from '../../shared/dialog.component';
import { ROLE_TONE, STATUS_TONE, joinedLabel, splitName } from '../../shared/user-display';
import { MemberFieldsComponent } from './member-fields.component';
import { createMemberForm } from './member-form';
import { MemberSummaryComponent } from './member-summary.component';

type DialogKind = 'details' | 'edit' | 'delete' | 'invite';

@Component({
  selector: 'app-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AvatarComponent, BadgeComponent, DialogComponent, MemberFieldsComponent, MemberSummaryComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent {
  private readonly usersService = inject(UsersService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly users = signal<User[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly dialog = signal<DialogKind | null>(null);
  protected readonly selectedId = signal<number | null>(null);
  protected readonly selected = computed(() => this.users().find((u) => u.id === this.selectedId()) ?? null);
  protected readonly selectedName = computed(() => splitName(this.selected()?.name ?? ''));

  protected readonly editForm = createMemberForm();
  protected readonly inviteForm = createMemberForm();

  protected readonly roleTone = ROLE_TONE;
  protected readonly statusTone = STATUS_TONE;
  protected readonly joinedLabel = joinedLabel;

  constructor() {
    this.reload();
  }

  // ---------- Dialog control ----------

  protected openDetails(user: User): void {
    this.selectedId.set(user.id);
    this.dialog.set('details');
  }

  protected openEdit(user: User): void {
    this.selectedId.set(user.id);
    const { firstName, lastName } = splitName(user.name);
    this.editForm.reset({ firstName, lastName, email: user.email, role: user.role });
    this.dialog.set('edit');
  }

  protected openDelete(user: User): void {
    this.selectedId.set(user.id);
    this.dialog.set('delete');
  }

  /** From the edit dialog: swap to the delete confirmation, keeping the selection. */
  protected editToDelete(): void {
    this.dialog.set('delete');
  }

  protected openInvite(): void {
    this.inviteForm.reset();
    this.dialog.set('invite');
  }

  protected close(): void {
    this.dialog.set(null);
    this.selectedId.set(null);
  }

  // ---------- CRUD ----------

  protected save(): void {
    const user = this.selected();
    if (!user || this.guardInvalid(this.editForm)) return;
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    this.run(
      this.usersService.update(user.id, { ...user, name: joinName(firstName, lastName), email, role: role as UserRole }),
    );
  }

  protected confirmDelete(): void {
    const user = this.selected();
    if (!user) return;
    this.run(this.usersService.delete(user.id));
  }

  protected invite(): void {
    if (this.guardInvalid(this.inviteForm)) return;
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = joinName(firstName, lastName);
    this.run(
      this.usersService.create({
        name,
        email,
        role: role as UserRole,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        status: 'Active',
        joinedDate: todayIso(),
      }),
      () => this.inviteForm.reset(),
    );
  }

  private guardInvalid(form: { invalid: boolean; markAllAsTouched(): void }): boolean {
    if (form.invalid) form.markAllAsTouched();
    return form.invalid;
  }

  /** Executes a mutation, then reloads the table and closes the dialog. */
  private run(request: Observable<unknown>, after?: () => void): void {
    this.saving.set(true);
    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          after?.();
          this.close();
          this.reload();
        },
        error: (err) => console.warn('Request failed', err),
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

function joinName(first: string, last: string): string {
  return `${first.trim()} ${last.trim()}`.trim();
}

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
