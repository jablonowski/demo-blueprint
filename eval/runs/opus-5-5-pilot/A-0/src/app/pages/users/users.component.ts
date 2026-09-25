import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { User, USER_ROLES, UserRole } from '../../core/user.model';
import { UsersService } from '../../core/users.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { BadgeComponent } from '../../shared/badge.component';
import { ModalComponent } from '../../shared/modal.component';
import { roleTone, statusTone } from '../../shared/user-badges';

type Dialog = 'details' | 'edit' | 'invite' | 'delete' | null;

@Component({
  selector: 'app-users',
  imports: [ReactiveFormsModule, DatePipe, NgTemplateOutlet, AvatarComponent, BadgeComponent, ModalComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly roles = USER_ROLES;
  protected readonly roleTone = roleTone;
  protected readonly statusTone = statusTone;

  protected readonly users = signal<User[]>([]);
  protected readonly loading = signal(true);
  protected readonly selected = signal<User | null>(null);
  protected readonly dialog = signal<Dialog>(null);

  protected readonly editForm = this.createMemberForm();
  protected readonly inviteForm = this.createMemberForm();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.usersService.getAll().subscribe((users) => {
      this.users.set(users);
      this.loading.set(false);
    });
  }

  // ---------- Dialog openers ----------

  openDetails(user: User): void {
    this.selected.set(user);
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    const [firstName, ...rest] = user.name.split(' ');
    this.editForm.reset({ firstName, lastName: rest.join(' '), email: user.email, role: user.role });
    this.selected.set(user);
    this.dialog.set('edit');
  }

  openInvite(): void {
    this.inviteForm.reset();
    this.dialog.set('invite');
  }

  openDelete(user: User): void {
    this.selected.set(user);
    this.dialog.set('delete');
  }

  /** From the edit dialog: swap to delete confirmation, keeping the selection. */
  editToDelete(): void {
    this.dialog.set('delete');
  }

  close(): void {
    this.dialog.set(null);
    this.selected.set(null);
  }

  // ---------- Mutations ----------

  confirmDelete(): void {
    const user = this.selected();
    if (!user) return;
    this.usersService.delete(user.id).subscribe(() => {
      this.load();
      this.close();
    });
  }

  saveEdit(): void {
    const user = this.selected();
    if (!user) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: joinName(firstName, lastName), email, role: role as UserRole };
    this.usersService.update(user.id, updated).subscribe(() => {
      this.load();
      this.close();
    });
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = joinName(firstName, lastName);
    this.usersService
      .create({
        name,
        email,
        role: role as UserRole,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        status: 'Active',
        joinedDate: todayIso(),
      })
      .subscribe(() => {
        this.load();
        this.inviteForm.reset();
        this.close();
      });
  }

  protected firstName(user: User): string {
    return user.name.split(' ')[0];
  }

  protected lastName(user: User): string {
    return user.name.split(' ').slice(1).join(' ');
  }

  private createMemberForm() {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
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
