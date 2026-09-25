import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { AvatarComponent } from '@jablonowski/dsb-components';

/** Avatar, name and joining date — the header row of the details and edit dialogs. */
@Component({
  selector: 'app-member-identity',
  imports: [AvatarComponent, DatePipe],
  template: `
    <dsb-avatar size="md" [name]="name()" />
    <div class="identity-text">
      <span class="identity-name">{{ name() }}</span>
      <span class="identity-since">Member since {{ joinedDate() | date: 'MMMM y' }}</span>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: var(--ds-decisions-space-lg);
    }

    .identity-text {
      display: flex;
      flex-direction: column;
      gap: var(--ds-decisions-space-3xs);
    }

    .identity-name {
      font-size: var(--ds-decisions-font-size-lg);
      font-weight: var(--ds-decisions-font-weight-semibold);
      color: var(--ds-decisions-color-text-primary);
      line-height: var(--ds-decisions-font-line-height-tight);
    }

    .identity-since {
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
