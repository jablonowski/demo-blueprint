import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { UserRole } from '../../../../core/models/user.model';

export interface InviteMemberPayload {
  name: string;
  email: string;
  role: UserRole;
}

@Component({
  selector: 'app-invite-dialog',
  standalone: true,
  imports: [ModalComponent, ReactiveFormsModule],
  templateUrl: './invite-dialog.component.html',
  styleUrl: './invite-dialog.component.css',
})
export class InviteDialogComponent {
  @Output() dismiss = new EventEmitter<void>();
  @Output() invite = new EventEmitter<InviteMemberPayload>();

  roles: UserRole[] = ['Admin', 'Editor', 'Viewer'];

  private fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['' as UserRole | '', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.form.getRawValue();
    this.invite.emit({ name: `${firstName} ${lastName}`.trim(), email, role: role as UserRole });
    this.form.reset({ firstName: '', lastName: '', email: '', role: '' });
  }
}
