import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ButtonComponent,
  DropdownComponent,
  DropdownOption,
  InputComponent,
  ModalComponent,
} from '@jablonowski/dsb-components';
import { UserRole } from '../../../core/models/user.model';

export interface InviteMemberPayload {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

@Component({
  selector: 'app-invite-member-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, ButtonComponent, InputComponent, DropdownComponent],
  templateUrl: './invite-member-dialog.component.html',
  styleUrl: './dialog-shared.css',
})
export class InviteMemberDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() open = false;

  @Output() closed = new EventEmitter<void>();
  @Output() invited = new EventEmitter<InviteMemberPayload>();

  protected readonly roleOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
  });

  protected hasSubmitted = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.form.reset({ firstName: '', lastName: '', email: '', role: '' });
      this.hasSubmitted = false;
    }
  }

  protected hasError(field: 'firstName' | 'lastName' | 'email' | 'role'): boolean {
    return this.hasSubmitted && this.form.controls[field].invalid;
  }

  protected onInvite(): void {
    this.hasSubmitted = true;
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    this.invited.emit({ ...value, role: value.role as UserRole });
  }
}
