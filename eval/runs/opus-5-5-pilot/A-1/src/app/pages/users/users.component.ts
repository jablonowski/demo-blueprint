import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Role, ROLES, Status, User } from '../../core/user.model';
import { UsersService } from '../../core/users.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { ModalComponent } from '../../shared/modal/modal.component';

type DialogKind = 'details' | 'edit' | 'delete' | 'invite';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function memberForm() {
  return new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    lastName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl<Role | ''>('', { nonNullable: true, validators: Validators.required })
  });
}

type MemberForm = ReturnType<typeof memberForm>;

@Component({
  selector: 'app-users',
  imports: [NgTemplateOutlet, ReactiveFormsModule, AvatarComponent, ModalComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);

  protected readonly roles = ROLES;
  protected readonly users = signal<User[]>([]);
  protected readonly loading = signal(true);
  protected readonly selected = signal<User | null>(null);
  protected readonly dialog = signal<DialogKind | null>(null);
  protected readonly saving = signal(false);

  protected readonly editForm = memberForm();
  protected readonly inviteForm = memberForm();

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.usersService.getAll().subscribe(users => {
      this.users.set(users);
      this.loading.set(false);
    });
  }

  protected roleTone(role: Role): string {
    return { Admin: 'badge--inverse', Editor: 'badge--info', Viewer: 'badge--outline' }[role];
  }

  protected statusTone(status: Status): string {
    return status === 'Active' ? 'badge--positive' : 'badge--negative';
  }

  protected memberSince(date: string): string {
    const [year, month] = date.split('-').map(Number);
    return `${MONTHS[month - 1]} ${year}`;
  }

  protected splitName(name: string): { first: string; last: string } {
    const [first, ...rest] = name.trim().split(/\s+/);
    return { first: first ?? '', last: rest.join(' ') };
  }

  protected hasError(form: MemberForm, name: keyof MemberForm['controls']): boolean {
    const control = form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  protected openDetails(user: User): void {
    this.selected.set(user);
    this.dialog.set('details');
  }

  protected openEdit(user: User): void {
    const { first, last } = this.splitName(user.name);
    this.selected.set(user);
    this.editForm.reset({ firstName: first, lastName: last, email: user.email, role: user.role });
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

  /** From the edit dialog: swap to delete confirmation, keeping the selection. */
  protected editToDelete(): void {
    this.dialog.set('delete');
  }

  protected close(): void {
    this.dialog.set(null);
    this.selected.set(null);
  }

  protected save(): void {
    const user = this.selected();
    if (!user) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: `${firstName.trim()} ${lastName.trim()}`, email, role: role as Role };
    this.saving.set(true);
    this.usersService.update(user.id, updated).subscribe(() => this.afterMutation());
  }

  protected invite(): void {
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
        email,
        role: role as Role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName.trim())}`,
        status: 'Active',
        joinedDate: new Date().toISOString().slice(0, 10)
      })
      .subscribe(() => {
        this.inviteForm.reset();
        this.afterMutation();
      });
  }

  protected confirmDelete(): void {
    const user = this.selected();
    if (!user) return;
    this.saving.set(true);
    this.usersService.delete(user.id).subscribe(() => this.afterMutation());
  }

  private afterMutation(): void {
    this.saving.set(false);
    this.load();
    this.close();
  }
}
