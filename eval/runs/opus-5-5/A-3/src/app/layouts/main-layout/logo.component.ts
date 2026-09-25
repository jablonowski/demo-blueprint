import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor" />
      <path d="M7 7h6.5a3 3 0 0 1 0 6H7zM7 13h7.5a3 3 0 0 1 0 6H7z" fill="none" stroke="var(--text-on-inverse)" stroke-width="1.8" stroke-linejoin="round" />
    </svg>
  `,
  styles: `
    :host { display: inline-flex; width: var(--space-6); height: var(--space-6); color: var(--text-primary); }
  `,
})
export class LogoComponent {}
