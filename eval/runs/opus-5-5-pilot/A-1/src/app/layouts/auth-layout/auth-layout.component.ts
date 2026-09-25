import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  template: `
    <main class="auth-shell">
      <div class="card auth-card"><router-outlet /></div>
    </main>
  `,
  styles: `
    .auth-shell {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: var(--space-6);
      background: var(--bg-page);
    }
    .auth-card {
      width: 100%;
      max-width: var(--auth-card-width);
      padding: var(--space-8);
    }
  `
})
export class AuthLayoutComponent {}
