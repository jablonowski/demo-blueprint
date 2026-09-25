import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Unauthenticated layout: a centred card shell. */
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
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: var(--sp-7);
      background: var(--c-canvas);
    }
    .auth-card {
      width: 100%;
      max-width: var(--auth-card-w);
      padding: var(--sp-10);
      background: var(--c-surface);
      border: var(--border-w) solid var(--c-border);
      border-radius: var(--radius-dialog);
      box-shadow: var(--shadow-auth);
    }
  `,
})
export class AuthLayoutComponent {}
