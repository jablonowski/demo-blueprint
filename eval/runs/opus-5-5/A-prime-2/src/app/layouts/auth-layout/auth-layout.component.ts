import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  template: `
    <main class="auth-shell">
      <section class="auth-card"><router-outlet /></section>
    </main>
  `,
  styles: `
    .auth-shell {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
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
