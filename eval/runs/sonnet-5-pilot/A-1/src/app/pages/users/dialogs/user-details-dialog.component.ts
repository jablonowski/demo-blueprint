import { Component, EventEmitter, Input, Output } from '@angular/core';
import { formatJoinedMonthYear, splitName, statusTone, User } from '../../../core/models/user.model';
import { AvatarComponent } from '../../../shared/avatar/avatar.component';
import { BadgeComponent } from '../../../shared/badge/badge.component';
import { ModalComponent } from '../../../shared/modal/modal.component';

@Component({
  selector: 'app-user-details-dialog',
  standalone: true,
  imports: [AvatarComponent, BadgeComponent, ModalComponent],
  templateUrl: './user-details-dialog.component.html'
})
export class UserDetailsDialogComponent {
  @Input({ required: true }) user!: User;
  @Output() closeDialog = new EventEmitter<void>();

  statusTone = statusTone;

  get firstName(): string {
    return splitName(this.user.name).firstName;
  }

  get lastName(): string {
    return splitName(this.user.name).lastName;
  }

  get memberSince(): string {
    return formatJoinedMonthYear(this.user.joinedDate);
  }
}
