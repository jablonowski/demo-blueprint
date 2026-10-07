import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent, CheckboxComponent, InputComponent } from '@jablonowski/dsb-components';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, ButtonComponent, CheckboxComponent, InputComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly invalidCredentials = signal(false);

  showError(name: 'username' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  passwordError(): string {
    return this.invalidCredentials() ? 'Invalid username or password' : 'Password is required';
  }

  submit(): void {
    this.invalidCredentials.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password } = this.form.getRawValue();
    if (this.auth.login(username, password)) {
      this.router.navigateByUrl('/dashboard');
    } else {
      this.invalidCredentials.set(true);
    }
  }
}
