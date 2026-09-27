import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from '../../../core/models/user.model';
import { statusTagClass } from '../badge-classes';

@Component({
  selector: 'app-member-details-dialog',
  standalone: true,
  templateUrl: './member-details-dialog.component.html',
  styleUrls: ['./modal-shared.css'],
})
export class MemberDetailsDialogComponent {
  @Input({ required: true }) user!: User;
  @Output() close = new EventEmitter<void>();

  get initials(): string {
    return this.user.name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }

  get firstName(): string {
    return this.user.name.split(' ')[0] ?? '';
  }

  get lastName(): string {
    return this.user.name.split(' ').slice(1).join(' ');
  }

  get statusTagClass(): string {
    return statusTagClass(this.user.status);
  }

  get memberSince(): string {
    const [year, month] = this.user.joinedDate.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}
