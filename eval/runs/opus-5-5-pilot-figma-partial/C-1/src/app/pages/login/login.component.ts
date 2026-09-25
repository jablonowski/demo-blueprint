import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent, CheckboxComponent, InputComponent } from '@jablonowski/dsb-components';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, InputComponent, CheckboxComponent, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  credentialsRejected = false;

  showError(field: 'username' | 'password'): boolean {
    const control = this.form.controls[field];
    return (control.invalid && control.touched) || (field === 'password' && this.credentialsRejected);
  }

  errorFor(field: 'username' | 'password'): string {
    if (this.form.controls[field].hasError('required')) {
      return field === 'username' ? 'Username is required' : 'Password is required';
    }
    return 'Invalid username or password';
  }

  submit(): void {
    this.credentialsRejected = false;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password } = this.form.getRawValue();
    if (this.auth.login(username, password)) {
      this.router.navigateByUrl('/dashboard');
    } else {
      this.credentialsRejected = true;
    }
  }
}
