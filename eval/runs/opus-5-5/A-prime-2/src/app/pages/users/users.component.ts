import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ROLES, Role, Status, User } from '../../core/user.model';
import { UsersService } from '../../core/users.service';
import { ModalComponent } from '../../shared/modal.component';

type Dialog = 'details' | 'edit' | 'invite' | 'delete' | null;

const ROLE_TAG: Record<Role, string> = { Admin: 'tag-danger', Editor: 'tag-info', Viewer: 'tag-default' };
const STATUS_TAG: Record<Status, string> = { Active: 'tag-success', Inactive: 'tag-default' };

@Component({
  selector: 'app-users',
  imports: [ReactiveFormsModule, NgTemplateOutlet, ModalComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent {
  private api = inject(UsersService);
  private fb = inject(FormBuilder).nonNullable;

  readonly roles = ROLES;
  readonly roleTag = ROLE_TAG;
  readonly statusTag = STATUS_TAG;

  users = signal<User[]>([]);
  loading = signal(true);
  dialog = signal<Dialog>(null);
  selected = signal<User | null>(null);
  saving = signal(false);
  brokenAvatars = signal<ReadonlySet<number>>(new Set());

  editForm = this.memberForm();
  inviteForm = this.memberForm();

  constructor() {
    this.load();
  }

  private memberForm() {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['' as Role | '', Validators.required],
    });
  }

  load() {
    this.api.getAll().subscribe((users) => {
      this.users.set(users);
      this.loading.set(false);
    });
  }

  // ---- Helpers -------------------------------------------------------------

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }

  private parseDate(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  joinedShort(iso: string): string {
    return this.parseDate(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  joinedLong(iso: string): string {
    return this.parseDate(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  firstName(name: string): string {
    return name.trim().split(/\s+/)[0] ?? '';
  }

  lastName(name: string): string {
    return name.trim().split(/\s+/).slice(1).join(' ');
  }

  avatarFailed(id: number) {
    this.brokenAvatars.update((s) => new Set(s).add(id));
  }

  invalid(form: ReturnType<UsersComponent['memberForm']>, name: keyof typeof form.controls): boolean {
    const c = form.controls[name];
    return c.invalid && c.touched;
  }

  // ---- Dialogs -------------------------------------------------------------

  openDetails(user: User) {
    this.selected.set(user);
    this.dialog.set('details');
  }

  openEdit(user: User) {
    this.selected.set(user);
    this.editForm.reset({
      firstName: this.firstName(user.name),
      lastName: this.lastName(user.name),
      email: user.email,
      role: user.role,
    });
    this.dialog.set('edit');
  }

  openInvite() {
    this.inviteForm.reset();
    this.dialog.set('invite');
  }

  openDelete(user: User) {
    this.selected.set(user);
    this.dialog.set('delete');
  }

  /** From the edit dialog: swap to the delete confirmation, keeping the selection. */
  editToDelete() {
    this.dialog.set('delete');
  }

  close() {
    this.dialog.set(null);
    this.selected.set(null);
    this.saving.set(false);
  }

  // ---- CRUD ----------------------------------------------------------------

  save() {
    const user = this.selected();
    if (!user) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const v = this.editForm.getRawValue();
    const updated: User = {
      ...user,
      name: `${v.firstName.trim()} ${v.lastName.trim()}`,
      email: v.email.trim(),
      role: v.role as Role,
    };
    this.saving.set(true);
    this.api.update(user.id, updated).subscribe(() => {
      this.close();
      this.load();
    });
  }

  invite() {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const v = this.inviteForm.getRawValue();
    const name = `${v.firstName.trim()} ${v.lastName.trim()}`;
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    this.saving.set(true);
    this.api
      .create({
        name,
        email: v.email.trim(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        role: v.role as Role,
        status: 'Active',
        joinedDate: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
      })
      .subscribe(() => {
        this.inviteForm.reset();
        this.close();
        this.load();
      });
  }

  confirmDelete() {
    const user = this.selected();
    if (!user) return;
    this.saving.set(true);
    this.api.delete(user.id).subscribe(() => {
      this.close();
      this.load();
    });
  }
}
