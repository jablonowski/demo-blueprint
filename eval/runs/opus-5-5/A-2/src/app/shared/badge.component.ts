import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-badge',
  template: `<ng-content />`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      padding: var(--space-0-75) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      line-height: 1.3;
      white-space: nowrap;
      background: var(--badge-bg);
      color: var(--badge-fg);
    }
    :host(.tone-success) { --badge-bg: var(--color-success-bg); --badge-fg: var(--color-success-fg); }
    :host(.tone-warning) { --badge-bg: var(--color-warning-bg); --badge-fg: var(--color-warning-fg); }
    :host(.tone-danger)  { --badge-bg: var(--color-danger-bg);  --badge-fg: var(--color-danger-fg); }
    :host(.tone-info)    { --badge-bg: var(--color-info-bg);    --badge-fg: var(--color-info-fg); }
    :host(.tone-neutral) { --badge-bg: var(--color-neutral-bg); --badge-fg: var(--color-neutral-fg); }
  `,
  host: { '[class]': '"tone-" + tone()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  readonly tone = input<BadgeTone>('neutral');
}
