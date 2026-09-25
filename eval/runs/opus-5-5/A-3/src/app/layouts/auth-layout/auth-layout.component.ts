import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <main class="auth-shell">
      <div class="auth-card"><router-outlet /></div>
    </main>
  `,
  styles: `
    .auth-shell {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: var(--space-6) var(--space-4);
      background: var(--surface-page);
    }
    .auth-card {
      width: 100%;
      max-width: var(--size-auth-card);
      padding: var(--space-10);
      background: var(--surface-card);
      border: var(--border-width) solid var(--border-default);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-auth);
    }
    @media (max-width: 480px) {
      .auth-card { padding: var(--space-6); }
    }
  `,
})
export class AuthLayoutComponent {}
