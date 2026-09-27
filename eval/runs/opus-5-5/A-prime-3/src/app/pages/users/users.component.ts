import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ROLES, Role, User } from '../../core/user.model';
import { UsersService } from '../../core/users.service';

type Dialog = 'none' | 'details' | 'edit' | 'invite' | 'delete';

@Component({
  selector: 'app-users',
  imports: [ReactiveFormsModule, DatePipe, NgTemplateOutlet],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private fb = inject(FormBuilder).nonNullable;

  readonly roles = ROLES;
  users = signal<User[]>([]);
  loading = signal(true);
  saving = signal(false);
  dialog = signal<Dialog>('none');
  selected = signal<User | null>(null);
  brokenAvatars = signal<Set<number>>(new Set());

  editForm = this.buildForm();
  inviteForm = this.buildForm();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.usersService.getAll().subscribe(users => {
      this.users.set(users);
      this.loading.set(false);
    });
  }

  // Dialog control
  openDetails(user: User): void {
    this.selected.set(user);
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    this.selected.set(user);
    const { first, last } = this.splitName(user.name);
    this.editForm.reset({ firstName: first, lastName: last, email: user.email, role: user.role });
    this.dialog.set('edit');
  }

  openInvite(): void {
    this.selected.set(null);
    this.inviteForm.reset();
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
    this.dialog.set('none');
    this.selected.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.dialog() !== 'none') this.close();
  }

  // CRUD
  save(): void {
    const user = this.selected();
    if (!user) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: this.joinName(firstName, lastName), email: email.trim(), role: role as Role };
    this.saving.set(true);
    this.usersService.update(user.id, updated).subscribe(() => {
      this.saving.set(false);
      this.close();
      this.load();
    });
  }

  invite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = this.joinName(firstName, lastName);
    this.saving.set(true);
    this.usersService.create({
      name,
      email: email.trim(),
      role: role as Role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      status: 'Active',
      joinedDate: new Date().toISOString().slice(0, 10)
    }).subscribe(() => {
      this.saving.set(false);
      this.inviteForm.reset();
      this.close();
      this.load();
    });
  }

  confirmDelete(): void {
    const user = this.selected();
    if (!user) return;
    this.saving.set(true);
    this.usersService.delete(user.id).subscribe(() => {
      this.saving.set(false);
      this.load();
      this.close();
    });
  }

  // Helpers
  invalid(form: 'edit' | 'invite', name: 'firstName' | 'lastName' | 'email' | 'role'): boolean {
    const c = (form === 'edit' ? this.editForm : this.inviteForm).controls[name];
    return c.invalid && c.touched;
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
  }

  firstName(name: string): string {
    return this.splitName(name).first;
  }

  lastName(name: string): string {
    return this.splitName(name).last;
  }

  roleTone(role: Role): string {
    return { Admin: 'tag-danger', Editor: 'tag-info', Viewer: 'tag-default' }[role];
  }

  statusTone(status: string): string {
    return status === 'Active' ? 'tag-success' : 'tag-default';
  }

  avatarFailed(id: number): void {
    this.brokenAvatars.update(s => new Set(s).add(id));
  }

  private splitName(name: string): { first: string; last: string } {
    const parts = name.trim().split(/\s+/);
    return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
  }

  private joinName(first: string, last: string): string {
    return `${first.trim()} ${last.trim()}`.trim();
  }

  private buildForm() {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required]
    });
  }
}
