import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserRole } from '../../../core/models/user.model';

export interface InviteMemberResult {
  name: string;
  email: string;
  role: UserRole;
}

@Component({
  selector: 'app-invite-member-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './invite-member-dialog.component.html',
  styleUrls: ['./modal-shared.css'],
})
export class InviteMemberDialogComponent {
  @Output() invite = new EventEmitter<InviteMemberResult>();
  @Output() cancel = new EventEmitter<void>();

  roles: UserRole[] = ['Admin', 'Editor', 'Viewer'];

  private fb = inject(FormBuilder);

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.form.getRawValue();
    this.invite.emit({
      name: `${firstName} ${lastName}`.trim(),
      email: email ?? '',
      role: role as UserRole,
    });
  }

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
}
