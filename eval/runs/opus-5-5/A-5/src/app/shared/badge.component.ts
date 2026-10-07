import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: { '[class]': '"badge badge--" + tone()' },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      padding: var(--space-badge-y) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      line-height: var(--leading-tight);
      white-space: nowrap;
    }
    :host(.badge--success) { background: var(--tone-success-bg); color: var(--tone-success-fg); }
    :host(.badge--warning) { background: var(--tone-warning-bg); color: var(--tone-warning-fg); }
    :host(.badge--danger)  { background: var(--tone-danger-bg);  color: var(--tone-danger-fg); }
    :host(.badge--info)    { background: var(--tone-info-bg);    color: var(--tone-info-fg); }
    :host(.badge--neutral) { background: var(--tone-neutral-bg); color: var(--tone-neutral-fg); }
  `,
})
export class BadgeComponent {
  readonly tone = input<Tone>('neutral');
}
