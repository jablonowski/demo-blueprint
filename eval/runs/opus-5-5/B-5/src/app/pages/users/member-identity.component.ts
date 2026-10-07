import { Component, computed, input } from '@angular/core';
import { AvatarComponent } from '@jablonowski/dsb-components';

/** Avatar initials, name and "Member since" line shown at the top of the member dialogs. */
@Component({
  selector: 'app-member-identity',
  imports: [AvatarComponent],
  template: `
    <dsb-avatar size="md" [name]="name()" />
    <div class="info">
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
    .info {
      display: flex;
      flex-direction: column;
      gap: var(--ds-decisions-space-3xs);
    }
    .name {
      font-size: var(--ds-decisions-font-size-lg);
      font-weight: var(--ds-decisions-font-weight-semibold);
      line-height: var(--ds-decisions-font-line-height-tight);
      color: var(--ds-decisions-color-text-primary);
    }
    .since {
      font-size: var(--ds-decisions-font-size-xs);
      line-height: var(--ds-decisions-font-line-height-tight);
      color: var(--ds-decisions-color-text-subtle);
    }
  `,
})
export class MemberIdentityComponent {
  readonly name = input.required<string>();
  readonly joinedDate = input.required<string>();

  readonly since = computed(() => {
    const [year, month] = this.joinedDate().split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });
}
