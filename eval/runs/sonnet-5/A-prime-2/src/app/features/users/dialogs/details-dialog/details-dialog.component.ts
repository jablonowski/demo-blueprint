import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { BadgeTone } from '../../../../shared/components/badge/badge.component';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-details-dialog',
  standalone: true,
  imports: [ModalComponent, AvatarComponent],
  templateUrl: './details-dialog.component.html',
  styleUrl: './details-dialog.component.css',
})
export class DetailsDialogComponent {
  @Input({ required: true }) user!: User;
  @Output() dismiss = new EventEmitter<void>();

  get firstName(): string {
    return this.user.name.split(' ')[0] ?? '';
  }

  get lastName(): string {
    return this.user.name.split(' ').slice(1).join(' ');
  }

  get memberSince(): string {
    return new Date(this.user.joinedDate).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }

  get statusTone(): BadgeTone {
    return this.user.status === 'Active' ? 'success' : 'default';
  }
}
