import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Unauthenticated shell: a single card centred on the page. */
@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  template: `
    <main class="auth-page">
      <section class="auth-card">
        <router-outlet />
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
      background: var(--ds-decisions-color-surface-hover);
    }

    .auth-card {
      width: 100%;
      max-width: var(--ds-decisions-layout-width-md);
      padding: var(--ds-decisions-space-5xl);
      background: var(--ds-decisions-color-surface-base);
      border: var(--ds-decisions-border-width-hairline) solid var(--ds-decisions-color-border-subtle);
      border-radius: var(--ds-decisions-border-radius-2xl);
      box-shadow: var(--ds-decisions-shadow-dropdown);
    }
  `,
})
export class AuthLayoutComponent {}
