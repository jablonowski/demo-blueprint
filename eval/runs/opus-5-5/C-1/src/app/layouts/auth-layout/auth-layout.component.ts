import { Component } from '@angular/core';

/** Unauthenticated shell: a single card centred on the page. */
@Component({
  selector: 'app-auth-layout',
  template: `
    <main class="auth-shell">
      <section class="auth-card">
        <ng-content />
      </section>
    </main>
  `,
  styles: `
    .auth-shell {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: var(--ds-decisions-space-3xl);
      background: var(--ds-decisions-color-surface-subtle);
    }

    .auth-card {
      width: 100%;
      max-width: var(--ds-decisions-layout-width-md);
      padding: var(--ds-decisions-space-5xl);
      background: var(--ds-decisions-color-surface-base);
      border: var(--ds-decisions-border-width-hairline) solid var(--ds-decisions-color-border-subtle);
      border-radius: var(--ds-decisions-border-radius-2xl);
    }
  `,
})
export class AuthLayoutComponent {}
