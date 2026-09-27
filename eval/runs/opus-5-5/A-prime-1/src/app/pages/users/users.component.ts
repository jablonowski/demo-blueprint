import { Component, inject, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ROLES, Role, Status, User } from '../../core/user.model';
import { UsersService } from '../../core/users.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { ModalComponent } from '../../shared/modal.component';

type Dialog = 'details' | 'edit' | 'delete' | 'invite' | null;

const ROLE_TONE: Record<Role, string> = { Admin: 'tag-danger', Editor: 'tag-info', Viewer: 'tag-default' };
const STATUS_TONE: Record<Status, string> = { Active: 'tag-success', Inactive: 'tag-default' };

@Component({
  selector: 'app-users',
  imports: [DatePipe, NgTemplateOutlet, ReactiveFormsModule, AvatarComponent, ModalComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly roles = ROLES;
  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly selected = signal<User | null>(null);
  readonly dialog = signal<Dialog>(null);
  readonly saving = signal(false);

  readonly editForm = this.memberForm();
  readonly inviteForm = this.memberForm();

  constructor() {
    this.load();
  }

  roleTone(role: Role): string {
    return ROLE_TONE[role];
  }

  statusTone(status: Status): string {
    return STATUS_TONE[status];
  }

  /** Seed dates are calendar dates; parse them as local time so the month never shifts. */
  joined(user: User): Date {
    return new Date(`${user.joinedDate}T00:00:00`);
  }

  invalid(form: FormGroup, name: string): boolean {
    const control = form.get(name);
    return !!control && control.invalid && control.touched;
  }

  openDetails(user: User): void {
    this.selected.set(user);
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    const [firstName, ...rest] = user.name.split(' ');
    this.selected.set(user);
    this.editForm.reset({ firstName, lastName: rest.join(' '), email: user.email, role: user.role });
    this.dialog.set('edit');
  }

  openDelete(user: User): void {
    this.selected.set(user);
    this.dialog.set('delete');
  }

  openInvite(): void {
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

  saveEdit(): void {
    const user = this.selected();
    if (!user) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: this.fullName(firstName, lastName), email, role: role as Role };
    this.saving.set(true);
    this.usersService.update(user.id, updated).subscribe({
      next: () => this.afterMutation(),
      error: () => this.saving.set(false),
    });
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = this.fullName(firstName, lastName);
    this.saving.set(true);
    this.usersService
      .create({
        name,
        email,
        role: role as Role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        status: 'Active',
        joinedDate: this.today(),
      })
      .subscribe({
        next: () => {
          this.inviteForm.reset();
          this.afterMutation();
        },
        error: () => this.saving.set(false),
      });
  }

  confirmDelete(): void {
    const user = this.selected();
    if (!user) return;
    this.saving.set(true);
    this.usersService.delete(user.id).subscribe({
      next: () => this.afterMutation(),
      error: () => this.saving.set(false),
    });
  }

  private afterMutation(): void {
    this.saving.set(false);
    this.close();
    this.load();
  }

  private load(): void {
    this.usersService.getAll().subscribe((users) => {
      this.users.set(users);
      this.loading.set(false);
    });
  }

  private memberForm() {
    return this.fb.nonNullable.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
    });
  }

  private fullName(first: string, last: string): string {
    return `${first.trim()} ${last.trim()}`.trim();
  }

  private today(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}
