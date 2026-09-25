import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AvatarComponent } from '../../shared/avatar.component';
import { User } from '../../core/user.model';

/** The avatar / name / "Member since" row shared by the details and edit dialogs. */
@Component({
  selector: 'app-member-summary',
  imports: [AvatarComponent, DatePipe],
  template: `
    <app-avatar [name]="user().name" size="md" />
    <div class="info">
      <span class="name">{{ user().name }}</span>
      <span class="since">Member since {{ user().joinedDate | date: 'MMMM y' : 'UTC' }}</span>
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
    }
    .name {
      font-size: var(--text-lg);
      font-weight: var(--weight-semibold);
      color: var(--color-fg);
    }
    .since {
      font-size: var(--text-sm);
      color: var(--color-fg-subtle);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberSummaryComponent {
  readonly user = input.required<User>();
}
