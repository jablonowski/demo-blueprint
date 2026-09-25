import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { User, initials } from '../../../core/user.model';

/** Initials avatar, name and "Member since" line shared by the details and edit dialogs. */
@Component({
  selector: 'app-member-summary',
  imports: [DatePipe],
  template: `
    <span class="avatar" aria-hidden="true">{{ letters() }}</span>
    <div class="text">
      <span class="name">{{ user().name }}</span>
      <span class="since">Member since {{ user().joinedDate | date: 'MMMM y' }}</span>
    </div>
  `,
  styles: `
    :host { display: flex; align-items: center; gap: 12px; }
    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      border-radius: 50%;
      background: var(--color-surface-recessed);
      color: var(--color-text-secondary);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
    }
    .text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .name { font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); }
    .since { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
  `,
})
export class MemberSummaryComponent {
  readonly user = input.required<User>();
  readonly letters = computed(() => initials(this.user().name));
}
