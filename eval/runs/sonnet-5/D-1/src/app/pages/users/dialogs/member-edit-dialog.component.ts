import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  AvatarComponent,
  ButtonComponent,
  DropdownComponent,
  InputComponent,
  ModalComponent,
  TagComponent
} from '@jablonowski/dsb-components';
import { Member, UserRole } from '../../../core/models/user.model';
import {
  ROLE_OPTIONS,
  createMemberForm,
  formatJoinedMonthYear,
  joinName,
  splitName,
  statusTagVariant
} from './member-form.util';

export interface MemberEditPayload {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

@Component({
  selector: 'app-member-edit-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, AvatarComponent, InputComponent, DropdownComponent, TagComponent, ButtonComponent],
  templateUrl: './member-edit-dialog.component.html',
  styleUrl: './member-edit-dialog.component.css'
})
export class MemberEditDialogComponent implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() open = false;
  @Input() member: Member | null = null;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<MemberEditPayload>();
  @Output() deleteRequested = new EventEmitter<Member>();

  readonly roleOptions = ROLE_OPTIONS;
  readonly statusTagVariant = statusTagVariant;
  submitted = false;

  form = createMemberForm(this.fb);

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['open'] || changes['member']) && this.open && this.member) {
      const { firstName, lastName } = splitName(this.member.name);
      this.form.reset({
        firstName,
        lastName,
        email: this.member.email,
        role: this.member.role
      });
      this.submitted = false;
    }
  }

  get memberSince(): string {
    return this.member ? formatJoinedMonthYear(this.member.joinedDate) : '';
  }

  onOpenChange(open: boolean): void {
    this.openChange.emit(open);
  }

  cancel(): void {
    this.openChange.emit(false);
  }

  requestDelete(): void {
    if (this.member) {
      this.deleteRequested.emit(this.member);
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid || !this.member) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, role } = this.form.getRawValue();
    this.save.emit({
      id: this.member.id,
      name: joinName(firstName, lastName),
      email,
      role: role as UserRole
    });
  }
}
