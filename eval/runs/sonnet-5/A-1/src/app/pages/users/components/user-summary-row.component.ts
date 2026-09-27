import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-summary-row',
  standalone: true,
  imports: [AvatarComponent, DatePipe],
  template: `
    <div class="user-summary-row">
      <ui-avatar [src]="user.avatar" [name]="user.name" size="md" />
      <div class="user-summary-row__info">
        <span class="user-summary-row__name">{{ user.name }}</span>
        <span class="user-summary-row__since">Member since {{ user.joinedDate | date: "MMMM y" }}</span>
      </div>
    </div>
  `,
  styleUrl: './user-summary-row.component.css'
})
export class UserSummaryRowComponent {
  @Input({ required: true }) user!: User;
}
