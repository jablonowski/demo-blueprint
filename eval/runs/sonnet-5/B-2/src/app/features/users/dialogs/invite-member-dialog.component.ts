import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ButtonComponent,
  DropdownComponent,
  DropdownOption,
  InputComponent,
  ModalComponent,
} from '@jablonowski/dsb-components';
import { combineName } from '../../../core/utils/name.util';
import { UsersService } from '../../../core/services/users.service';
import { User } from '../../../core/models/user.model';

const ROLE_OPTIONS: DropdownOption[] = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Editor', label: 'Editor' },
  { value: 'Viewer', label: 'Viewer' },
];

@Component({
  selector: 'app-invite-member-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, ButtonComponent, InputComponent, DropdownComponent],
  templateUrl: './invite-member-dialog.component.html',
  styleUrl: './invite-member-dialog.component.css',
})
export class InviteMemberDialogComponent {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();
  @Output() invited = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);

  readonly roleOptions = ROLE_OPTIONS;

  sending = false;

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
  });

  get firstName() {
    return this.form.controls.firstName;
  }

  get lastName() {
    return this.form.controls.lastName;
  }

  get email() {
    return this.form.controls.email;
  }

  get role() {
    return this.form.controls.role;
  }

  onCancel(): void {
    this.closed.emit();
  }

  onModalClosed(): void {
    this.closed.emit();
  }

  onSendInvite(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, role } = this.form.getRawValue();
    const name = combineName(firstName ?? '', lastName ?? '');
    const today = new Date().toISOString().slice(0, 10);

    this.sending = true;
    this.usersService
      .create({
        name,
        email: email ?? '',
        role: (role ?? 'Viewer') as User['role'],
        status: 'Active',
        joinedDate: today,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      })
      .subscribe(() => {
        this.sending = false;
        this.form.reset({ firstName: '', lastName: '', email: '', role: '' });
        this.invited.emit();
      });
  }
}
