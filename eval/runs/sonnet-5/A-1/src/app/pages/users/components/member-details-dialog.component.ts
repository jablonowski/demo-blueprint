import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { ButtonDirective } from '../../../shared/ui/button/button.directive';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { UserSummaryRowComponent } from './user-summary-row.component';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-member-details-dialog',
  standalone: true,
  imports: [ModalComponent, ButtonDirective, BadgeComponent, UserSummaryRowComponent],
  templateUrl: './member-details-dialog.component.html'
})
export class MemberDetailsDialogComponent {
  @Input({ required: true }) user!: User;
  @Output() closed = new EventEmitter<void>();

  get firstName(): string {
    return this.user.name.split(' ')[0] ?? '';
  }

  get lastName(): string {
    return this.user.name.split(' ').slice(1).join(' ');
  }
}
