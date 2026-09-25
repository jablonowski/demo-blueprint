import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Role, Status } from '../core/user.model';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const ROLE_TONE: Record<Role, BadgeTone> = { Admin: 'danger', Editor: 'info', Viewer: 'neutral' };
export const STATUS_TONE: Record<Status, BadgeTone> = { Active: 'success', Inactive: 'neutral' };

@Component({
  selector: 'app-badge',
  template: '<ng-content />',
  host: { '[class]': '"badge badge--" + tone()' },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      padding: var(--padding-badge);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      line-height: var(--leading-tight);
      white-space: nowrap;
    }
    :host(.badge--success) { background: var(--color-success-bg); color: var(--color-success-fg); }
    :host(.badge--warning) { background: var(--color-warning-bg); color: var(--color-warning-fg); }
    :host(.badge--danger)  { background: var(--color-danger-bg);  color: var(--color-danger-fg); }
    :host(.badge--info)    { background: var(--color-info-bg);    color: var(--color-info-fg); }
    :host(.badge--neutral) { background: var(--color-neutral-bg); color: var(--color-neutral-fg); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  readonly tone = input<BadgeTone>('neutral');
}
