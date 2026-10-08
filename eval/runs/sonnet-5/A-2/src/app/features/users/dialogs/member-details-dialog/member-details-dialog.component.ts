import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalShellComponent } from '../../../../shared/components/modal-shell/modal-shell.component';
import { UserAvatarComponent } from '../../components/user-avatar/user-avatar.component';
import { BadgeComponent } from '../../components/badge/badge.component';
import { User } from '../../../../core/models/user.model';
import { formatMonthYear, splitName } from '../../../../core/utils/name.util';

@Component({
  selector: 'app-member-details-dialog',
  standalone: true,
  imports: [ModalShellComponent, UserAvatarComponent, BadgeComponent],
  templateUrl: './member-details-dialog.component.html',
  styleUrl: './member-details-dialog.component.scss'
})
export class MemberDetailsDialogComponent {
  @Input({ required: true }) user!: User;
  @Output() close = new EventEmitter<void>();

  get firstName(): string {
    return splitName(this.user.name).firstName;
  }

  get lastName(): string {
    return splitName(this.user.name).lastName;
  }

  get memberSince(): string {
    return formatMonthYear(this.user.joinedDate);
  }
}
