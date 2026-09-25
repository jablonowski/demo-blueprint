import { Component } from '@angular/core';

/** Layout 1 — the centred card shell for unauthenticated screens. */
@Component({
  selector: 'app-auth-layout',
  template: `
    <main class="auth-page">
      <section class="auth-card">
        <ng-content />
      </section>
    </main>
  `,
  styles: `
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--ds-decisions-space-3xl);
      background: var(--ds-decisions-color-surface-subtle);
    }

    .auth-card {
      width: 100%;
      max-width: var(--ds-decisions-layout-width-md);
      padding: var(--ds-decisions-space-5xl);
      display: flex;
      flex-direction: column;
      gap: var(--ds-decisions-space-2xl);
      background: var(--ds-decisions-color-surface-base);
      border: var(--ds-decisions-border-width-hairline) solid var(--ds-decisions-color-border-subtle);
      border-radius: var(--ds-decisions-border-radius-2xl);
      box-shadow: var(--ds-decisions-shadow-modal);
    }
  `,
})
export class AuthLayoutComponent {}
