import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ROLES, Role, User } from '../../core/user.model';
import { UsersService } from '../../core/users.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { BadgeComponent, ROLE_TONE, STATUS_TONE } from '../../shared/badge.component';
import { ModalComponent } from '../../shared/modal.component';

type Dialog = 'details' | 'edit' | 'invite' | 'delete' | null;
type FormField = 'firstName' | 'lastName' | 'email' | 'role';

@Component({
  selector: 'app-users',
  imports: [DatePipe, NgTemplateOutlet, ReactiveFormsModule, AvatarComponent, BadgeComponent, ModalComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {
  private readonly usersService = inject(UsersService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly roles = ROLES;
  protected readonly roleTone = ROLE_TONE;
  protected readonly statusTone = STATUS_TONE;

  protected readonly users = signal<User[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly selected = signal<User | null>(null);
  protected readonly dialog = signal<Dialog>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['' as Role | '', Validators.required],
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.usersService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((users) => {
        this.users.set(users);
        this.loading.set(false);
      });
  }

  protected hasError(name: FormField): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  protected firstName(user: User): string {
    return user.name.split(/\s+/)[0] ?? '';
  }

  protected lastName(user: User): string {
    return user.name.split(/\s+/).slice(1).join(' ');
  }

  // ---------- Dialog openers ----------

  protected openDetails(user: User): void {
    this.selected.set(user);
    this.dialog.set('details');
  }

  protected openEdit(user: User): void {
    this.selected.set(user);
    this.form.reset({
      firstName: this.firstName(user),
      lastName: this.lastName(user),
      email: user.email,
      role: user.role,
    });
    this.dialog.set('edit');
  }

  protected openInvite(): void {
    this.selected.set(null);
    this.form.reset({ firstName: '', lastName: '', email: '', role: '' });
    this.dialog.set('invite');
  }

  protected openDelete(user: User): void {
    this.selected.set(user);
    this.dialog.set('delete');
  }

  /** From the edit dialog: swap to the delete confirmation, keeping the selection. */
  protected editToDelete(): void {
    this.dialog.set('delete');
  }

  protected close(): void {
    this.dialog.set(null);
    this.selected.set(null);
  }

  // ---------- Mutations ----------

  protected save(): void {
    const user = this.selected();
    if (!user || !this.validate()) return;

    const { firstName, lastName, email, role } = this.form.getRawValue();
    const updated: User = { ...user, name: `${firstName.trim()} ${lastName.trim()}`, email, role: role as Role };
    this.run(this.usersService.update(user.id, updated));
  }

  protected invite(): void {
    if (!this.validate()) return;

    const { firstName, lastName, email, role } = this.form.getRawValue();
    const name = `${firstName.trim()} ${lastName.trim()}`;
    this.run(
      this.usersService.create({
        name,
        email,
        role: role as Role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName.trim())}`,
        status: 'Active',
        joinedDate: new Date().toISOString().slice(0, 10),
      }),
      () => this.form.reset({ firstName: '', lastName: '', email: '', role: '' }),
    );
  }

  protected confirmDelete(): void {
    const user = this.selected();
    if (!user) return;
    this.run(this.usersService.delete(user.id));
  }

  private validate(): boolean {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return false;
    }
    return true;
  }

  private run(request: ReturnType<UsersService['delete']>, after?: () => void): void {
    this.saving.set(true);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
