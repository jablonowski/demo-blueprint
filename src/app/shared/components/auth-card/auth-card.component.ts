import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-card',
  standalone: true,
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: var(--ds-decisions-color-surface-base, #fafafa); padding: 24px;
    }
    .auth-card {
      background: var(--ds-decisions-color-surface-card, #ffffff);
      border: 1px solid var(--ds-decisions-color-border-subtle, #e5e5e5);
      border-radius: 10px; padding: 40px; width: 100%; max-width: 400px;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
    }
  `]
})
export class AuthCardComponent {}
