import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent, InputComponent, CheckboxComponent } from '@jablonowski/dsb-components';
import { AuthCardComponent } from '../../shared/components/auth-card/auth-card.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent, CheckboxComponent, AuthCardComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loginError = false;

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  get usernameCtrl() { return this.form.get('username')!; }
  get passwordCtrl() { return this.form.get('password')!; }

  usernameError(): boolean { return this.usernameCtrl.invalid && this.usernameCtrl.touched; }
  passwordError(): boolean { return this.passwordCtrl.invalid && this.passwordCtrl.touched; }

  onUsernameChange(v: string) { this.usernameCtrl.setValue(v); }
  onPasswordChange(v: string) { this.passwordCtrl.setValue(v); }

  submit() {
    this.loginError = false;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { username, password } = this.form.value;
    if (this.auth.login(username!, password!)) {
      this.router.navigate(['/dashboard']);
    } else {
      this.loginError = true;
    }
  }
}
