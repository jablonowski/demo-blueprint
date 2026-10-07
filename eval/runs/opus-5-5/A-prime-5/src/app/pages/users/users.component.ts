import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ROLES, Role, User, roleTag, statusTag } from '../../core/user.model';
import { UsersService } from '../../core/users.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { ModalComponent } from '../../shared/modal.component';

type Dialog = 'none' | 'details' | 'edit' | 'invite' | 'delete';

function memberForm() {
  return new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    lastName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl<Role | ''>('', { nonNullable: true, validators: Validators.required }),
  });
}
type MemberForm = ReturnType<typeof memberForm>;

function splitName(name: string): [string, string] {
  const parts = name.trim().split(/\s+/);
  return [parts[0] ?? '', parts.slice(1).join(' ')];
}

@Component({
  selector: 'app-users',
  imports: [DatePipe, NgTemplateOutlet, ReactiveFormsModule, AvatarComponent, ModalComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent {
  private api = inject(UsersService);

  readonly roles = ROLES;
  readonly roleTag = roleTag;
  readonly statusTag = statusTag;

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dialog = signal<Dialog>('none');
  readonly selected = signal<User | null>(null);

  readonly editForm = memberForm();
  readonly inviteForm = memberForm();

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getAll().subscribe((users) => {
      this.users.set(users);
      this.loading.set(false);
    });
  }

  openDetails(user: User): void {
    this.selected.set(user);
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    const [firstName, lastName] = splitName(user.name);
    this.selected.set(user);
    this.editForm.reset({ firstName, lastName, email: user.email, role: user.role });
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

  save(): void {
    const user = this.selected();
    if (!user) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: `${firstName.trim()} ${lastName.trim()}`.trim(), email, role: role as Role };
    this.saving.set(true);
    this.api.update(user.id, updated).subscribe(() => this.done());
  }

  invite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    this.saving.set(true);
    this.api
      .create({
        name,
        email,
        role: role as Role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        status: 'Active',
        joinedDate: new Date().toISOString().slice(0, 10),
      })
      .subscribe(() => {
        this.inviteForm.reset();
        this.done();
      });
  }

  confirmDelete(): void {
    const user = this.selected();
    if (!user) return;
    this.saving.set(true);
    this.api.delete(user.id).subscribe(() => this.done());
  }

  invalid(form: MemberForm, name: keyof MemberForm['controls']): boolean {
    const c = form.controls[name];
    return c.invalid && c.touched;
  }

  private done(): void {
    this.saving.set(false);
    this.close();
    this.load();
  }
}
