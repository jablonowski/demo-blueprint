import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AvatarComponent, ButtonComponent, ModalComponent, TagComponent } from '@jablonowski/dsb-components';
import { User } from '../../../core/models/user.model';
import { formatMonthYear, splitName } from '../../../core/utils/name.util';
import { statusVariant } from '../../../core/utils/badge.util';

@Component({
  selector: 'app-member-details-dialog',
  standalone: true,
  imports: [ModalComponent, ButtonComponent, AvatarComponent, TagComponent],
  templateUrl: './member-details-dialog.component.html',
  styleUrl: './member-details-dialog.component.css',
})
export class MemberDetailsDialogComponent {
  @Input() open = false;
  @Input() user: User | null = null;
  @Output() closed = new EventEmitter<void>();

  readonly statusVariant = statusVariant;

  get firstName(): string {
    return this.user ? splitName(this.user.name).firstName : '';
  }

  get lastName(): string {
    return this.user ? splitName(this.user.name).lastName : '';
  }

  get memberSince(): string {
    return this.user ? formatMonthYear(this.user.joinedDate) : '';
  }

  onClose(): void {
    this.closed.emit();
  }

  onModalClosed(): void {
    this.closed.emit();
  }
}
