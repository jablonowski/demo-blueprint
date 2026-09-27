import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { ButtonDirective } from '../../../shared/ui/button/button.directive';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { UserSummaryRowComponent } from './user-summary-row.component';
import { MemberFormComponent } from './member-form.component';
import { User, UserRole } from '../../../core/models/user.model';

export interface EditMemberResult {
  name: string;
  email: string;
  role: UserRole;
}

@Component({
  selector: 'app-edit-member-dialog',
  standalone: true,
  imports: [ModalComponent, ButtonDirective, BadgeComponent, UserSummaryRowComponent, MemberFormComponent, ReactiveFormsModule],
  templateUrl: './edit-member-dialog.component.html'
})
export class EditMemberDialogComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input({ required: true }) user!: User;
  @Output() saved = new EventEmitter<EditMemberResult>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() deleteRequested = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['' as UserRole, Validators.required]
  });

  ngOnInit(): void {
    const [firstName, ...rest] = this.user.name.split(' ');
    this.form.setValue({
      firstName: firstName ?? '',
      lastName: rest.join(' '),
      email: this.user.email,
      role: this.user.role
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, role } = this.form.getRawValue();
    this.saved.emit({ name: `${firstName} ${lastName}`.trim(), email, role });
  }
}
