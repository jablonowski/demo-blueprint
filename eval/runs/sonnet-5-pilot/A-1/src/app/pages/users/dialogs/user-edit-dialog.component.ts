import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { splitName, statusTone, User, UserRole, USER_ROLES } from '../../../core/models/user.model';
import { AvatarComponent } from '../../../shared/avatar/avatar.component';
import { BadgeComponent } from '../../../shared/badge/badge.component';
import { ModalComponent } from '../../../shared/modal/modal.component';

export interface UserEditFormValue {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

@Component({
  selector: 'app-user-edit-dialog',
  standalone: true,
  imports: [AvatarComponent, BadgeComponent, ModalComponent, ReactiveFormsModule],
  templateUrl: './user-edit-dialog.component.html'
})
export class UserEditDialogComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input({ required: true }) user!: User;
  @Output() save = new EventEmitter<UserEditFormValue>();
  @Output() cancel = new EventEmitter<void>();
  @Output() deleteRequested = new EventEmitter<User>();

  roles = USER_ROLES;
  statusTone = statusTone;

  form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: this.fb.nonNullable.control<UserRole>('Viewer', Validators.required)
  });

  ngOnInit(): void {
    const { firstName, lastName } = splitName(this.user.name);
    this.form.setValue({
      firstName,
      lastName,
      email: this.user.email,
      role: this.user.role
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.getRawValue());
  }

  onDeleteClick(): void {
    this.deleteRequested.emit(this.user);
  }
}
