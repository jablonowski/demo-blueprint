import { Component, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'danger' | 'info' | 'outline';

@Component({
  selector: 'app-badge',
  template: `<span class="badge badge--{{ tone() }}"><ng-content /></span>`,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: 2px var(--space-2);
      border: 1px solid transparent;
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      line-height: var(--leading-normal);
      white-space: nowrap;
    }
    .badge--neutral { background: var(--color-bg-muted); color: var(--color-fg-muted); }
    .badge--primary { background: var(--color-primary); color: var(--color-primary-fg); }
    .badge--success { background: var(--color-success-bg); color: var(--color-success); }
    .badge--danger { background: var(--color-danger-bg); color: var(--color-danger); }
    .badge--info { background: var(--color-info-bg); color: var(--color-info); }
    .badge--outline { border-color: var(--color-border); color: var(--color-fg-muted); }
  `,
})
export class BadgeComponent {
  readonly tone = input<BadgeTone>('neutral');
}
