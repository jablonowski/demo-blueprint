import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AvatarComponent,
  ButtonComponent,
  DropdownComponent,
  DropdownOption,
  InputComponent,
  ModalComponent,
  TagComponent,
} from '@jablonowski/dsb-components';
import { User } from '../../../core/models/user.model';
import { combineName, formatMonthYear, splitName } from '../../../core/utils/name.util';
import { statusVariant } from '../../../core/utils/badge.util';
import { UsersService } from '../../../core/services/users.service';

const ROLE_OPTIONS: DropdownOption[] = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Editor', label: 'Editor' },
  { value: 'Viewer', label: 'Viewer' },
];

@Component({
  selector: 'app-edit-member-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, ButtonComponent, AvatarComponent, InputComponent, DropdownComponent, TagComponent],
  templateUrl: './edit-member-dialog.component.html',
  styleUrl: './edit-member-dialog.component.css',
})
export class EditMemberDialogComponent implements OnChanges {
  @Input() open = false;
  @Input() user: User | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
  @Output() deleteRequested = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);

  readonly roleOptions = ROLE_OPTIONS;
  readonly statusVariant = statusVariant;

  saving = false;

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
  });

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

  get memberSince(): string {
    return this.user ? formatMonthYear(this.user.joinedDate) : '';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['open'] || changes['user']) && this.open && this.user) {
      const { firstName, lastName } = splitName(this.user.name);
      this.form.reset({
        firstName,
        lastName,
        email: this.user.email,
        role: this.user.role,
      });
    }
  }

  onCancel(): void {
    this.closed.emit();
  }

  onModalClosed(): void {
    this.closed.emit();
  }

  onDeleteUser(): void {
    this.deleteRequested.emit();
  }

  onSave(): void {
    if (this.form.invalid || !this.user) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, role } = this.form.getRawValue();
    this.saving = true;
    this.usersService
      .update(this.user.id, {
        ...this.user,
        name: combineName(firstName ?? '', lastName ?? ''),
        email: email ?? '',
        role: (role ?? 'Viewer') as User['role'],
      })
      .subscribe(() => {
        this.saving = false;
        this.saved.emit();
      });
  }
}
