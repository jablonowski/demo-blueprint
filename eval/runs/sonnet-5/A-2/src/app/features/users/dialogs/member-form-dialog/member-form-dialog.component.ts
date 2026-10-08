import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalShellComponent } from '../../../../shared/components/modal-shell/modal-shell.component';
import { UserAvatarComponent } from '../../components/user-avatar/user-avatar.component';
import { BadgeComponent } from '../../components/badge/badge.component';
import { User, UserRole } from '../../../../core/models/user.model';
import { formatMonthYear, splitName } from '../../../../core/utils/name.util';

export interface MemberFormValue {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

@Component({
  selector: 'app-member-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ModalShellComponent, UserAvatarComponent, BadgeComponent],
  templateUrl: './member-form-dialog.component.html',
  styleUrl: './member-form-dialog.component.scss'
})
export class MemberFormDialogComponent implements OnInit {
  @Input({ required: true }) mode!: 'edit' | 'invite';
  @Input() user?: User;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<MemberFormValue>();
  @Output() deleteRequested = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  readonly roles: UserRole[] = ['Admin', 'Editor', 'Viewer'];

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['' as UserRole | '', Validators.required]
  });

  ngOnInit(): void {
    if (this.mode === 'edit' && this.user) {
      const { firstName, lastName } = splitName(this.user.name);
      this.form.patchValue({
        firstName,
        lastName,
        email: this.user.email,
        role: this.user.role
      });
    }
  }

  get title(): string {
    return this.mode === 'edit' ? 'Edit Member' : 'Invite Member';
  }

  get memberSince(): string {
    return this.user ? formatMonthYear(this.user.joinedDate) : '';
  }

  get f() {
    return this.form.controls;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, role } = this.form.getRawValue();
    this.save.emit({
      firstName: firstName!.trim(),
      lastName: lastName!.trim(),
      email: email!.trim(),
      role: role as UserRole
    });
  }
}
