import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AvatarComponent, ButtonComponent, ModalComponent, TagComponent, TagVariant } from '@jablonowski/dsb-components';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-member-details-dialog',
  standalone: true,
  imports: [ModalComponent, ButtonComponent, AvatarComponent, TagComponent],
  templateUrl: './member-details-dialog.component.html',
  styleUrl: './dialog-shared.css',
})
export class MemberDetailsDialogComponent {
  @Input() open = false;
  @Input() user: User | null = null;

  @Output() closed = new EventEmitter<void>();

  protected get firstName(): string {
    return this.user?.name.split(' ')[0] ?? '';
  }

  protected get lastName(): string {
    return this.user?.name.split(' ').slice(1).join(' ') ?? '';
  }

  protected get memberSince(): string {
    if (!this.user) {
      return '';
    }
    const date = new Date(this.user.joinedDate);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  protected get statusVariant(): TagVariant {
    return this.user?.status === 'Active' ? 'success' : 'default';
  }
}
