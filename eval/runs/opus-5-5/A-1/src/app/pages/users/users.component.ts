import { Component, inject, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { UsersService } from '../../core/users.service';
import { Role, User } from '../../core/user.model';
import { AvatarComponent } from '../../shared/avatar.component';
import { ModalComponent } from '../../shared/modal.component';
import { ROLE_TONE, STATUS_TONE } from '../../shared/tones';
import { MemberFieldsComponent, MemberForm } from './member-fields.component';

type Dialog = 'details' | 'edit' | 'delete' | 'invite';

function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

function joinName(first: string, last: string): string {
  return `${first.trim()} ${last.trim()}`.trim();
}

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

@Component({
  selector: 'app-users',
  imports: [DatePipe, NgTemplateOutlet, ReactiveFormsModule, AvatarComponent, ModalComponent, MemberFieldsComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent {
  private readonly users = inject(UsersService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly roleTone = ROLE_TONE;
  protected readonly statusTone = STATUS_TONE;

  protected readonly list = signal<User[]>([]);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly dialog = signal<Dialog | null>(null);
  protected readonly selected = signal<User | null>(null);

  protected readonly editForm = this.buildForm();
  protected readonly inviteForm = this.buildForm();

  constructor() {
    this.reload();
  }

  private buildForm(): MemberForm {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: this.fb.control<Role | ''>('', Validators.required),
    });
  }

  private reload(): void {
    this.users.getAll().subscribe({
      next: users => {
        this.list.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ---------- dialog control ----------
  protected openDetails(user: User): void {
    this.selected.set(user);
    this.dialog.set('details');
  }

  protected openEdit(user: User): void {
    this.selected.set(user);
    this.editForm.reset({ ...splitName(user.name), email: user.email, role: user.role });
    this.dialog.set('edit');
  }

  protected openDelete(user: User): void {
    this.selected.set(user);
    this.dialog.set('delete');
  }

  protected openInvite(): void {
    this.selected.set(null);
    this.inviteForm.reset();
    this.dialog.set('invite');
  }

  /** From the edit dialog: swap to the delete confirmation, keeping the selection. */
  protected editToDelete(): void {
    this.dialog.set('delete');
  }

  protected close(): void {
    if (this.busy()) return;
    this.dialog.set(null);
    this.selected.set(null);
  }

  // ---------- mutations ----------
  protected confirmDelete(): void {
    const user = this.selected();
    if (!user) return;
    this.busy.set(true);
    this.users
      .delete(user.id)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe(() => {
        this.reload();
        this.dialog.set(null);
        this.selected.set(null);
      });
  }

  protected save(): void {
    const user = this.selected();
    if (!user) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: joinName(firstName, lastName), email, role: role as Role };
    this.busy.set(true);
    this.users
      .update(user.id, updated)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe(() => {
        this.reload();
        this.dialog.set(null);
        this.selected.set(null);
      });
  }

  protected invite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = joinName(firstName, lastName);
    this.busy.set(true);
    this.users
      .create({
        name,
        email,
        role: role as Role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        status: 'Active',
        joinedDate: todayIso(),
      })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe(() => {
        this.reload();
        this.inviteForm.reset();
        this.dialog.set(null);
      });
  }

  protected firstName(u: User): string {
    return splitName(u.name).firstName;
  }

  protected lastName(u: User): string {
    return splitName(u.name).lastName;
  }
}
