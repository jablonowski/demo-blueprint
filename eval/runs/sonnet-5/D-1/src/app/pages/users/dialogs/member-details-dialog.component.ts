import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AvatarComponent, ButtonComponent, ModalComponent, TagComponent } from '@jablonowski/dsb-components';
import { Member } from '../../../core/models/user.model';
import { formatJoinedMonthYear, splitName, statusTagVariant } from './member-form.util';

@Component({
  selector: 'app-member-details-dialog',
  standalone: true,
  imports: [ModalComponent, AvatarComponent, TagComponent, ButtonComponent],
  templateUrl: './member-details-dialog.component.html',
  styleUrl: './member-details-dialog.component.css'
})
export class MemberDetailsDialogComponent {
  @Input() open = false;
  @Input() member: Member | null = null;
  @Output() openChange = new EventEmitter<boolean>();

  readonly statusTagVariant = statusTagVariant;

  get firstName(): string {
    return this.member ? splitName(this.member.name).firstName : '';
  }

  get lastName(): string {
    return this.member ? splitName(this.member.name).lastName : '';
  }

  get memberSince(): string {
    return this.member ? formatJoinedMonthYear(this.member.joinedDate) : '';
  }

  onOpenChange(open: boolean): void {
    this.openChange.emit(open);
  }

  close(): void {
    this.openChange.emit(false);
  }
}
