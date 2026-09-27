import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { ButtonDirective } from '../../../shared/ui/button/button.directive';
import { MemberFormComponent } from './member-form.component';
import { UserRole } from '../../../core/models/user.model';

export interface InviteMemberResult {
  name: string;
  email: string;
  role: UserRole;
}

@Component({
  selector: 'app-invite-member-dialog',
  standalone: true,
  imports: [ModalComponent, ButtonDirective, MemberFormComponent, ReactiveFormsModule],
  template: `
    <ui-modal (closed)="cancelled.emit()">
      <div modalHeader class="dialog-header">
        <h2 class="dialog-header__title">Invite Member</h2>
        <button class="dialog-header__close" type="button" (click)="cancelled.emit()">✕</button>
      </div>

      <form modalBody [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <app-member-form [group]="form" rolePlaceholder="Select role…" />
      </form>

      <div modalFooter class="dialog-footer">
        <button uiButton variant="secondary" type="button" (click)="cancelled.emit()">Cancel</button>
        <button uiButton variant="primary" type="button" (click)="onSubmit()">Send Invite</button>
      </div>
    </ui-modal>
  `
})
export class InviteMemberDialogComponent {
  private fb = inject(FormBuilder);

  @Output() saved = new EventEmitter<InviteMemberResult>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['' as UserRole, Validators.required]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, role } = this.form.getRawValue();
    this.saved.emit({ name: `${firstName} ${lastName}`.trim(), email, role });
  }
}
