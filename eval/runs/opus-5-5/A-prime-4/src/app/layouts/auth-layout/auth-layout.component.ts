import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  template: `
    <main class="auth-shell">
      <div class="auth-card"><router-outlet /></div>
    </main>
  `,
  styles: `
    .auth-shell {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: var(--color-surface-subtle);
    }
    .auth-card {
      width: 100%;
      max-width: 400px;
      padding: 40px;
      background: var(--color-surface-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-card);
    }
  `,
})
export class AuthLayoutComponent {}
