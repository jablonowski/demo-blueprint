import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent, CheckboxComponent, InputComponent } from '@jablonowski/dsb-components';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, InputComponent, CheckboxComponent, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly submitted = signal(false);
  protected readonly loginFailed = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected hasError(field: 'username' | 'password'): boolean {
    const control = this.form.controls[field];
    return this.submitted() && control.invalid;
  }

  protected onSubmit(): void {
    this.submitted.set(true);
    this.loginFailed.set(false);

    if (this.form.invalid) {
      return;
    }

    const { username, password } = this.form.getRawValue();
    if (this.auth.login(username, password)) {
      this.router.navigateByUrl('/dashboard');
    } else {
      this.loginFailed.set(true);
    }
  }
}
