import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
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
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: var(--space-6);
      background: var(--color-bg-page);
    }
    .auth-card {
      width: 100%;
      max-width: var(--width-auth-card);
      padding: var(--space-10);
      background: var(--color-bg-surface);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-auth);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {}
