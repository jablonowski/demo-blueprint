import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Blueprint wordmark with a small grid mark. */
@Component({
  selector: 'app-logo',
  template: `
    <svg class="mark" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="1" y="1" width="18" height="18" rx="4" />
      <path d="M6 6h3.5v3.5H6zM10.5 10.5H14V14h-3.5zM10.5 6H14v3.5h-3.5z" />
    </svg>
    <span class="wordmark">Blueprint</span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--color-fg);
    }
    .mark {
      width: var(--space-5);
      height: var(--space-5);
      rect { fill: var(--color-fg); }
      path { fill: var(--color-fg-inverse); }
    }
    .wordmark {
      font-size: var(--text-lg);
      font-weight: var(--weight-semibold);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {}
