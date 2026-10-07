import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { AvatarComponent } from '@jablonowski/dsb-components';

/** Avatar with initials, name and joining month — the user row at the top of the member dialogs. */
@Component({
  selector: 'app-member-identity',
  imports: [AvatarComponent, DatePipe],
  template: `
    <dsb-avatar [name]="name()" size="md" />
    <div class="text">
      <span class="name">{{ name() }}</span>
      <span class="since">Member since {{ joinedDate() | date: 'MMMM y' }}</span>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: var(--ds-decisions-space-lg);
    }

    .text {
      display: flex;
      flex-direction: column;
      gap: var(--ds-decisions-space-3xs);
      min-width: 0;
    }

    .name {
      font-size: var(--ds-decisions-font-size-lg);
      font-weight: var(--ds-decisions-font-weight-semibold);
      color: var(--ds-decisions-color-text-primary);
      line-height: var(--ds-decisions-font-line-height-tight);
    }

    .since {
      font-size: var(--ds-decisions-font-size-xs);
      color: var(--ds-decisions-color-text-subtle);
      line-height: var(--ds-decisions-font-line-height-tight);
    }
  `,
})
export class MemberIdentityComponent {
  readonly name = input.required<string>();
  readonly joinedDate = input.required<string>();
}
