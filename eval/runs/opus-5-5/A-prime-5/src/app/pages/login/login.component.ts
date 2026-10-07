import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <form class="login" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="intro">
        <h1 class="title">Welcome back</h1>
        <p class="subtitle">Sign in to your account to continue</p>
      </div>

      <div class="field">
        <label class="field-label" for="username">Username</label>
        <input id="username" class="field-input" type="text" formControlName="username"
               placeholder="Enter your username" autocomplete="username"
               [class.is-invalid]="showError('username')" />
        @if (showError('username')) {
          <span class="field-error">Username is required</span>
        }
      </div>

      <div class="field">
        <label class="field-label" for="password">Password</label>
        <input id="password" class="field-input" type="password" formControlName="password"
               placeholder="Enter your password" autocomplete="current-password"
               [class.is-invalid]="showError('password') || failed()" />
        @if (showError('password')) {
          <span class="field-error">Password is required</span>
        } @else if (failed()) {
          <span class="field-error">Invalid username or password</span>
        }
      </div>

      <div class="remember-row">
        <label class="remember">
          <input type="checkbox" />
          <span>Remember me</span>
        </label>
        <a class="link" href="#" (click)="$event.preventDefault()">Forgot password?</a>
      </div>

      <button type="submit" class="btn btn-primary submit">Sign In</button>

      <p class="signup">
        Don't have an account?
        <a class="link" href="#" (click)="$event.preventDefault()">Sign up</a>
      </p>
    </form>
  `,
  styles: `
    .login { display: flex; flex-direction: column; gap: 20px; }
    .intro { display: flex; flex-direction: column; gap: 6px; }
    .title { margin: 0; font-size: var(--font-size-2xl); font-weight: var(--font-weight-semibold); }
    .subtitle { margin: 0; font-size: var(--font-size-base); color: var(--color-text-muted); }
    .remember-row { display: flex; justify-content: space-between; align-items: center; }
    .remember { display: inline-flex; align-items: center; gap: 8px; font-size: var(--font-size-base); cursor: pointer; }
    .remember input {
      appearance: none;
      width: 16px;
      height: 16px;
      margin: 0;
      border: 1.5px solid var(--color-border-input);
      border-radius: var(--radius-sm);
      background: var(--color-surface-card);
      cursor: pointer;
    }
    .remember input:checked {
      background: var(--color-primary);
      border-color: var(--color-primary);
      box-shadow: inset 0 0 0 2px var(--color-surface-card);
    }
    .link {
      color: var(--color-text-primary);
      font-weight: var(--font-weight-medium);
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .remember-row .link { font-size: var(--font-size-base); }
    .submit { width: 100%; height: 42px; font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); }
    .signup {
      margin: 0;
      display: flex;
      justify-content: center;
      gap: 6px;
      font-size: var(--font-size-base);
      color: var(--color-text-muted);
    }
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly failed = signal(false);
  readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: Validators.required }),
    password: new FormControl('', { nonNullable: true, validators: Validators.required }),
  });

  showError(name: 'username' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  submit(): void {
    this.failed.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password } = this.form.getRawValue();
    if (this.auth.login(username, password)) {
      this.router.navigate(['/dashboard']);
    } else {
      this.failed.set(true);
    }
  }
}
