import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { User, UserRole } from '../../../core/models/user.model';
import { statusTagClass } from '../badge-classes';

export interface EditMemberResult {
  name: string;
  email: string;
  role: UserRole;
}

@Component({
  selector: 'app-edit-member-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './edit-member-dialog.component.html',
  styleUrls: ['./modal-shared.css'],
})
export class EditMemberDialogComponent implements OnInit {
  @Input({ required: true }) user!: User;
  @Output() save = new EventEmitter<EditMemberResult>();
  @Output() deleteRequested = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  roles: UserRole[] = ['Admin', 'Editor', 'Viewer'];

  private fb = inject(FormBuilder);

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['' as UserRole, Validators.required],
  });

  ngOnInit(): void {
    const [firstName, ...rest] = this.user.name.split(' ');
    this.form.patchValue({
      firstName,
      lastName: rest.join(' '),
      email: this.user.email,
      role: this.user.role,
    });
  }

  get initials(): string {
    return this.user.name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }

  get statusTagClass(): string {
    return statusTagClass(this.user.status);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.form.getRawValue();
    this.save.emit({
      name: `${firstName} ${lastName}`.trim(),
      email: email ?? '',
      role: (role as UserRole) || 'Viewer',
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
