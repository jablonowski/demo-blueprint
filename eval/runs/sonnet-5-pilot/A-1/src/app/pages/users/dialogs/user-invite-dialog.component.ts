import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserRole, USER_ROLES } from '../../../core/models/user.model';
import { ModalComponent } from '../../../shared/modal/modal.component';

export interface UserInviteFormValue {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

@Component({
  selector: 'app-user-invite-dialog',
  standalone: true,
  imports: [ModalComponent, ReactiveFormsModule],
  templateUrl: './user-invite-dialog.component.html'
})
export class UserInviteDialogComponent {
  private fb = inject(FormBuilder);

  @Output() send = new EventEmitter<UserInviteFormValue>();
  @Output() cancel = new EventEmitter<void>();

  roles = USER_ROLES;

  form = this.fb.group({
    firstName: this.fb.nonNullable.control('', Validators.required),
    lastName: this.fb.nonNullable.control('', Validators.required),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    role: this.fb.control<UserRole | null>(null, Validators.required)
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.send.emit({
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      role: value.role as UserRole
    });
  }
}
