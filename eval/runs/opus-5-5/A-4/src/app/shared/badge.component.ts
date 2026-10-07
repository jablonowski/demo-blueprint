import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-tone]': 'tone()' },
  template: `<ng-content />`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      padding: var(--space-0-75) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      line-height: var(--line-height-tight);
      white-space: nowrap;
    }
    :host([data-tone='success']) { background: var(--tone-success-bg); color: var(--tone-success-fg); }
    :host([data-tone='warning']) { background: var(--tone-warning-bg); color: var(--tone-warning-fg); }
    :host([data-tone='danger']) { background: var(--tone-danger-bg); color: var(--tone-danger-fg); }
    :host([data-tone='info']) { background: var(--tone-info-bg); color: var(--tone-info-fg); }
    :host([data-tone='neutral']) { background: var(--tone-neutral-bg); color: var(--tone-neutral-fg); }
  `,
})
export class BadgeComponent {
  readonly tone = input<BadgeTone>('neutral');
}
