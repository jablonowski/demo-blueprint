import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Unauthenticated shell: a single centred card on the page background (Figma "Login" frame). */
@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <main class="auth-shell">
      <div class="auth-card">
        <router-outlet />
      </div>
    </main>
  `,
  styles: `
    .auth-shell {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: var(--space-6);
      background: var(--surface-page);
    }
    .auth-card {
      width: 100%;
      max-width: var(--size-auth-card);
      padding: var(--space-10);
      background: var(--surface-card);
      border: var(--border-width) solid var(--border-default);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-auth-card);
    }
  `,
})
export class AuthLayoutComponent {}
