import { Component, computed, input } from '@angular/core';
import { AvatarComponent } from '@jablonowski/dsb-components';
import { memberSince } from './member-form';

/** Avatar (initials), name and "Member since" line used at the top of the details and edit dialogs. */
@Component({
  selector: 'app-member-identity',
  imports: [AvatarComponent],
  template: `
    <dsb-avatar [name]="name()" size="lg" shape="circle" />
    <div class="text">
      <span class="name">{{ name() }}</span>
      <span class="since">Member since {{ since() }}</span>
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
      font-size: var(--ds-decisions-font-size-xl);
      font-weight: var(--ds-decisions-font-weight-semibold);
      color: var(--ds-decisions-color-text-primary);
      line-height: var(--ds-decisions-font-line-height-tight);
    }
    .since {
      font-size: var(--ds-decisions-font-size-sm);
      color: var(--ds-decisions-color-text-muted);
    }
  `,
})
export class MemberIdentityComponent {
  readonly name = input.required<string>();
  readonly joinedDate = input.required<string>();
  readonly since = computed(() => memberSince(this.joinedDate()));
}
