import { Component, inject, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet, formatDate } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { UsersService } from '../../core/users.service';
import { ROLES, ROLE_TAG, Role, STATUS_TAG, User, initials } from '../../core/user.model';

type Dialog = 'none' | 'details' | 'edit' | 'invite' | 'delete';

@Component({
  selector: 'app-users',
  imports: [DatePipe, NgTemplateOutlet, ReactiveFormsModule, ModalComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent {
  private usersService = inject(UsersService);
  private fb = inject(FormBuilder).nonNullable;

  readonly roles = ROLES;
  readonly roleTag = ROLE_TAG;
  readonly statusTag = STATUS_TAG;
  readonly initials = initials;

  users = signal<User[]>([]);
  loading = signal(true);
  saving = signal(false);
  dialog = signal<Dialog>('none');
  selected = signal<User | null>(null);
  brokenAvatars = signal<ReadonlySet<number>>(new Set());

  editForm = this.buildForm();
  inviteForm = this.buildForm();

  constructor() {
    this.load();
  }

  load(): void {
    this.usersService.getAll().subscribe((users) => {
      this.users.set(users);
      this.loading.set(false);
    });
  }

  onAvatarError(id: number): void {
    this.brokenAvatars.update((set) => new Set(set).add(id));
  }

  openDetails(user: User): void {
    this.selected.set(user);
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    this.selected.set(user);
    const [firstName, ...rest] = user.name.split(' ');
    this.editForm.reset({ firstName, lastName: rest.join(' '), email: user.email, role: user.role });
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

  /** From the edit dialog: swap to the delete confirmation, keeping the selection. */
  editToDelete(): void {
    this.dialog.set('delete');
  }

  close(): void {
    this.dialog.set('none');
    this.selected.set(null);
  }

  saveEdit(): void {
    const user = this.selected();
    if (!user || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: `${firstName.trim()} ${lastName.trim()}`, email: email.trim(), role: role as Role };
    this.saving.set(true);
    this.usersService.update(user.id, updated).subscribe(() => this.afterMutation());
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = `${firstName.trim()} ${lastName.trim()}`;
    this.saving.set(true);
    this.usersService
      .create({
        name,
        email: email.trim(),
        role: role as Role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName.trim())}`,
        status: 'Active',
        joinedDate: formatDate(new Date(), 'yyyy-MM-dd', 'en-US'),
      })
      .subscribe(() => {
        this.inviteForm.reset();
        this.afterMutation();
      });
  }

  confirmDelete(): void {
    const user = this.selected();
    if (!user) return;
    this.saving.set(true);
    this.usersService.delete(user.id).subscribe(() => this.afterMutation());
  }

  invalid(form: FormGroup, name: string): boolean {
    const control = form.get(name);
    return !!control && control.invalid && control.touched;
  }

  private afterMutation(): void {
    this.saving.set(false);
    this.load();
    this.close();
  }

  private buildForm() {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
    });
  }
}
