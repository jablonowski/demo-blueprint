import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AvatarComponent,
  ButtonComponent,
  DropdownComponent,
  DropdownOption,
  InputComponent,
  ModalComponent,
  TagComponent,
  TagVariant,
} from '@jablonowski/dsb-components';
import { User, UserRole } from '../../../core/models/user.model';

export interface EditMemberPayload {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

@Component({
  selector: 'app-edit-member-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ModalComponent,
    ButtonComponent,
    AvatarComponent,
    TagComponent,
    InputComponent,
    DropdownComponent,
  ],
  templateUrl: './edit-member-dialog.component.html',
  styleUrl: './dialog-shared.css',
})
export class EditMemberDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() open = false;
  @Input() user: User | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<EditMemberPayload>();
  @Output() deleteRequested = new EventEmitter<void>();

  protected readonly roleOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['Viewer' as UserRole, Validators.required],
  });

  protected hasSubmitted = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open && this.user) {
      const [firstName, ...rest] = this.user.name.split(' ');
      this.form.setValue({
        firstName,
        lastName: rest.join(' '),
        email: this.user.email,
        role: this.user.role,
      });
      this.hasSubmitted = false;
    }
  }

  protected get statusVariant(): TagVariant {
    return this.user?.status === 'Active' ? 'success' : 'default';
  }

  protected hasError(field: 'firstName' | 'lastName' | 'email' | 'role'): boolean {
    return this.hasSubmitted && this.form.controls[field].invalid;
  }

  protected onSave(): void {
    this.hasSubmitted = true;
    if (this.form.invalid || !this.user) {
      return;
    }
    const value = this.form.getRawValue();
    this.saved.emit({ id: this.user.id, ...value });
  }
}
