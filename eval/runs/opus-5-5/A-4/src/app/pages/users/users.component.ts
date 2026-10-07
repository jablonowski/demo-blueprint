import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { USER_ROLES, User, UserRole } from '../../core/user.model';
import { UsersService } from '../../core/users.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { BadgeComponent } from '../../shared/badge.component';
import { ModalComponent } from '../../shared/modal.component';
import { ROLE_TONE, STATUS_TONE } from '../../shared/user-tones';

type DialogKind = 'details' | 'edit' | 'delete' | 'invite';

function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

function joinName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

@Component({
  selector: 'app-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, NgTemplateOutlet, AvatarComponent, BadgeComponent, ModalComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly roles = USER_ROLES;
  protected readonly roleTone = ROLE_TONE;
  protected readonly statusTone = STATUS_TONE;

  protected readonly users = signal<User[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly selected = signal<User | null>(null);
  protected readonly dialog = signal<DialogKind | null>(null);

  protected readonly editForm = this.buildMemberForm();
  protected readonly inviteForm = this.buildMemberForm();

  ngOnInit(): void {
    this.reload();
  }

  // ---------- Dialog control ----------
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
    this.inviteForm.reset();
    this.dialog.set('invite');
  }

  /** From the edit dialog: swap to the delete confirmation, keeping the selection. */
  protected editToDelete(): void {
    this.dialog.set('delete');
  }

  protected closeDialog(): void {
    this.dialog.set(null);
    this.selected.set(null);
  }

  // ---------- CRUD ----------
  protected confirmDelete(): void {
    const user = this.selected();
    if (!user) return;
    this.saving.set(true);
    this.usersService.delete(user.id).subscribe({
      next: () => {
        this.closeDialog();
        this.reload();
      },
      complete: () => this.saving.set(false),
      error: () => this.saving.set(false),
    });
  }

  protected saveEdit(): void {
    const user = this.selected();
    if (!user) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: joinName(firstName, lastName), email, role: role as UserRole };
    this.saving.set(true);
    this.usersService.update(user.id, updated).subscribe({
      next: () => {
        this.closeDialog();
        this.reload();
      },
      complete: () => this.saving.set(false),
      error: () => this.saving.set(false),
    });
  }

  protected sendInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = joinName(firstName, lastName);
    this.saving.set(true);
    this.usersService
      .create({
        name,
        email,
        role: role as UserRole,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName.trim() || name)}`,
        status: 'Active',
        joinedDate: todayIso(),
      })
      .subscribe({
        next: () => {
          this.inviteForm.reset();
          this.closeDialog();
          this.reload();
        },
        complete: () => this.saving.set(false),
        error: () => this.saving.set(false),
      });
  }

  // ---------- Helpers ----------
  protected firstName(user: User): string {
    return splitName(user.name).firstName;
  }

  protected lastName(user: User): string {
    return splitName(user.name).lastName;
  }

  protected hasError(form: 'edit' | 'invite', control: 'firstName' | 'lastName' | 'email' | 'role'): boolean {
    const c = (form === 'edit' ? this.editForm : this.inviteForm).controls[control];
    return c.invalid && c.touched;
  }

  private reload(): void {
    this.usersService.getAll().subscribe((users) => {
      this.users.set(users);
      this.loading.set(false);
    });
  }

  private buildMemberForm() {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['' as UserRole | '', Validators.required],
    });
  }
}
