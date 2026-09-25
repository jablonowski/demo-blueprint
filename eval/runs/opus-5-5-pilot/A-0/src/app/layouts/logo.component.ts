import { Component } from '@angular/core';

@Component({
  selector: 'app-logo',
  template: `
    <span class="logo">
      <svg class="logo__mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect width="24" height="24" rx="6" fill="currentColor" />
        <path d="M7 12.5 10.5 16 17 8.5" stroke="var(--color-primary-fg)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="logo__text">Blueprint</span>
    </span>
  `,
  styles: `
    .logo {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--color-primary);
    }
    .logo__mark { width: var(--space-6); height: var(--space-6); }
    .logo__text {
      font-size: var(--text-base);
      font-weight: var(--weight-semibold);
      color: var(--color-fg);
    }
  `,
})
export class LogoComponent {}
