import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeTone = 'positive' | 'warning' | 'negative' | 'info' | 'neutral';

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  host: { '[class]': '"badge badge--" + tone()' },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      padding: var(--space-0-75) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      line-height: var(--leading-tight);
      white-space: nowrap;
    }
    :host(.badge--positive) { background: var(--tone-positive-bg); color: var(--tone-positive-fg); }
    :host(.badge--warning)  { background: var(--tone-warning-bg);  color: var(--tone-warning-fg); }
    :host(.badge--negative) { background: var(--tone-negative-bg); color: var(--tone-negative-fg); }
    :host(.badge--info)     { background: var(--tone-info-bg);     color: var(--tone-info-fg); }
    :host(.badge--neutral)  { background: var(--tone-neutral-bg);  color: var(--tone-neutral-fg); }
  `,
})
export class BadgeComponent {
  readonly tone = input<BadgeTone>('neutral');
}
