import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { BadgeTone } from '../../../../shared/components/badge/badge.component';
import { User, UserRole } from '../../../../core/models/user.model';

export interface EditMemberPayload {
  name: string;
  email: string;
  role: UserRole;
}

@Component({
  selector: 'app-edit-dialog',
  standalone: true,
  imports: [ModalComponent, AvatarComponent, ReactiveFormsModule],
  templateUrl: './edit-dialog.component.html',
  styleUrl: './edit-dialog.component.css',
})
export class EditDialogComponent implements OnChanges {
  @Input({ required: true }) user!: User;
  @Output() dismiss = new EventEmitter<void>();
  @Output() save = new EventEmitter<EditMemberPayload>();
  @Output() requestDelete = new EventEmitter<void>();

  roles: UserRole[] = ['Admin', 'Editor', 'Viewer'];

  private fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['' as UserRole, Validators.required],
  });

  ngOnChanges(): void {
    if (this.user) {
      const [firstName, ...rest] = this.user.name.split(' ');
      this.form.setValue({
        firstName: firstName ?? '',
        lastName: rest.join(' '),
        email: this.user.email,
        role: this.user.role,
      });
    }
  }

  get statusTone(): BadgeTone {
    return this.user.status === 'Active' ? 'success' : 'default';
  }

  get memberSince(): string {
    return new Date(this.user.joinedDate).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.form.getRawValue();
    this.save.emit({ name: `${firstName} ${lastName}`.trim(), email, role });
  }
}
