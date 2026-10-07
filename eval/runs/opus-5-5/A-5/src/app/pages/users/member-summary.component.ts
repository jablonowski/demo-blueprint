import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { User } from '../../core/user.model';
import { AvatarComponent } from '../../shared/avatar.component';

/** The avatar + name + "Member since" row at the top of the edit and details dialogs. */
@Component({
  selector: 'app-member-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarComponent, DatePipe],
  template: `
    <app-avatar [name]="user().name" size="md" />
    <div class="info">
      <span class="name">{{ user().name }}</span>
      <span class="since">Member since {{ user().joinedDate | date: 'MMMM y' }}</span>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: var(--space-3-5);
    }
    .info {
      display: flex;
      flex-direction: column;
      gap: var(--space-0-5);
      min-width: 0;
    }
    .name {
      font-size: var(--text-lg);
      font-weight: var(--weight-semibold);
      color: var(--color-fg);
    }
    .since {
      font-size: var(--text-sm);
      color: var(--color-fg-muted);
    }
  `,
})
export class MemberSummaryComponent {
  readonly user = input.required<User>();
}
