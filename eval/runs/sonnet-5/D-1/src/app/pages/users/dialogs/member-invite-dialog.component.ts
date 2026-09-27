import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent, DropdownComponent, InputComponent, ModalComponent } from '@jablonowski/dsb-components';
import { UserRole } from '../../../core/models/user.model';
import { ROLE_OPTIONS, createMemberForm, joinName } from './member-form.util';

export interface MemberInvitePayload {
  name: string;
  email: string;
  role: UserRole;
}

@Component({
  selector: 'app-member-invite-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, InputComponent, DropdownComponent, ButtonComponent],
  templateUrl: './member-invite-dialog.component.html',
  styleUrl: './member-invite-dialog.component.css'
})
export class MemberInviteDialogComponent implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() invite = new EventEmitter<MemberInvitePayload>();

  readonly roleOptions = ROLE_OPTIONS;
  submitted = false;

  form = createMemberForm(this.fb);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.form.reset({ firstName: '', lastName: '', email: '', role: '' });
      this.submitted = false;
    }
  }

  onOpenChange(open: boolean): void {
    this.openChange.emit(open);
  }

  cancel(): void {
    this.openChange.emit(false);
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, role } = this.form.getRawValue();
    this.invite.emit({ name: joinName(firstName, lastName), email, role: role as UserRole });
  }
}
