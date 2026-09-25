import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  template: `
    <main class="auth">
      <div class="card auth__card"><router-outlet /></div>
    </main>
  `,
  styles: `
    .auth {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: var(--space-6);
      background: var(--color-bg-muted);
    }
    .auth__card {
      width: 100%;
      max-width: var(--auth-card-width);
      padding: var(--space-8);
    }
  `,
})
export class AuthLayoutComponent {}
