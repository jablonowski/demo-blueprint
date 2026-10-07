import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService } from '../../core/users.service';
import { Role, Status, User } from '../../core/user.model';
import { ModalComponent } from '../../shared/modal/modal.component';

type Dialog = 'details' | 'edit' | 'invite' | 'delete' | null;

const ROLE_TAG: Record<Role, string> = { Admin: 'tag-danger', Editor: 'tag-info', Viewer: 'tag-default' };
const STATUS_TAG: Record<Status, string> = { Active: 'tag-success', Inactive: 'tag-default' };

@Component({
  selector: 'app-users',
  imports: [DatePipe, NgTemplateOutlet, ReactiveFormsModule, ModalComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private fb = inject(FormBuilder);

  readonly roles: Role[] = ['Admin', 'Editor', 'Viewer'];

  users = signal<User[]>([]);
  loading = signal(true);
  selected = signal<User | null>(null);
  dialog = signal<Dialog>(null);
  saving = signal(false);
  brokenAvatars = signal<Set<number>>(new Set());

  editForm = this.memberForm();
  inviteForm = this.memberForm();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.usersService.getAll().subscribe((users) => {
      this.users.set(users);
      this.loading.set(false);
    });
  }

  roleTag(role: Role): string {
    return ROLE_TAG[role] ?? 'tag-default';
  }

  statusTag(status: Status): string {
    return STATUS_TAG[status] ?? 'tag-default';
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  }

  avatarFailed(id: number): void {
    this.brokenAvatars.update((s) => new Set(s).add(id));
  }

  firstName(name: string): string {
    return name.trim().split(/\s+/)[0] ?? '';
  }

  lastName(name: string): string {
    return name.trim().split(/\s+/).slice(1).join(' ');
  }

  openDetails(user: User): void {
    this.selected.set(user);
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    this.selected.set(user);
    this.editForm.reset({
      firstName: this.firstName(user.name),
      lastName: this.lastName(user.name),
      email: user.email,
      role: user.role,
    });
    this.dialog.set('edit');
  }

  openInvite(): void {
    this.inviteForm.reset({ firstName: '', lastName: '', email: '', role: '' });
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

  save(): void {
    const user = this.selected();
    if (!user || this.editForm.invalid) {
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
    const v = this.inviteForm.getRawValue();
    const first = v.firstName.trim();
    const name = `${first} ${v.lastName.trim()}`;
    this.saving.set(true);
    this.usersService
      .create({
        name,
        email: v.email.trim(),
        role: v.role as Role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(first)}`,
        status: 'Active',
        joinedDate: this.today(),
      })
      .subscribe(() => {
        this.saving.set(false);
        this.inviteForm.reset({ firstName: '', lastName: '', email: '', role: '' });
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

  invalid(form: 'edit' | 'invite', name: 'firstName' | 'lastName' | 'email' | 'role'): boolean {
    const c = (form === 'edit' ? this.editForm : this.inviteForm).controls[name];
    return c.invalid && c.touched;
  }

  private today(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private memberForm() {
    return this.fb.nonNullable.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
    });
  }
}
