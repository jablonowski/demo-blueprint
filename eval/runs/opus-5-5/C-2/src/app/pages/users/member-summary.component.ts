import { Component, computed, input } from '@angular/core';
import { AvatarComponent } from '@jablonowski/dsb-components';
import { User } from '../../core/user.model';

/** Avatar, name and "Member since" line shared by the details and edit dialogs. */
@Component({
  selector: 'app-member-summary',
  imports: [AvatarComponent],
  template: `
    <div class="member">
      <dsb-avatar [name]="user().name" size="md" shape="circle" />
      <div class="member-info">
        <span class="member-name">{{ user().name }}</span>
        <span class="member-since">Member since {{ joined() }}</span>
      </div>
    </div>
  `,
  styles: `
    .member {
      display: flex;
      align-items: center;
      gap: var(--ds-decisions-space-lg);
    }

    .member-info {
      display: flex;
      flex-direction: column;
      gap: var(--ds-decisions-space-3xs);
    }

    .member-name {
      font-size: var(--ds-decisions-font-size-lg);
      font-weight: var(--ds-decisions-font-weight-semibold);
      line-height: var(--ds-decisions-font-line-height-tight);
      color: var(--ds-decisions-color-text-primary);
    }

    .member-since {
      font-size: var(--ds-decisions-font-size-xs);
      line-height: var(--ds-decisions-font-line-height-tight);
      color: var(--ds-decisions-color-text-subtle);
    }
  `,
})
export class MemberSummaryComponent {
  readonly user = input.required<User>();

  readonly joined = computed(() =>
    new Date(`${this.user().joinedDate}T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  );
}
