import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DropdownComponent, InputComponent } from '@jablonowski/dsb-components';
import { MemberForm, ROLE_OPTIONS } from './member-form';

/** Fields shared by the edit and invite dialogs. */
@Component({
  selector: 'app-member-form-fields',
  imports: [ReactiveFormsModule, InputComponent, DropdownComponent],
  template: `
    <div class="fields" [formGroup]="form()">
      <div class="two-col">
        <dsb-input
          formControlName="firstName"
          label="First name"
          placeholder="First name"
          [hasError]="showError('firstName')"
          errorMessage="First name is required"
        />
        <dsb-input
          formControlName="lastName"
          label="Last name"
          placeholder="Last name"
          [hasError]="showError('lastName')"
          errorMessage="Last name is required"
        />
      </div>
      <dsb-input
        formControlName="email"
        type="email"
        label="Email address"
        placeholder="name@example.com"
        [hasError]="showError('email')"
        [errorMessage]="form().controls.email.hasError('email') ? 'Enter a valid email address' : 'Email address is required'"
      />
      <dsb-dropdown
        formControlName="role"
        label="Role"
        [placeholder]="rolePlaceholder()"
        [options]="roleOptions"
        [hasError]="showError('role')"
        errorMessage="Role is required"
      />
    </div>
  `,
  styles: `
    .fields {
      display: flex;
      flex-direction: column;
      gap: var(--ds-decisions-space-xl);
    }
    .two-col {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--ds-decisions-space-lg);
    }
  `,
})
export class MemberFormFieldsComponent {
  readonly form = input.required<MemberForm>();
  readonly rolePlaceholder = input('Select role…');
  readonly roleOptions = ROLE_OPTIONS;

  showError(name: keyof MemberForm['controls']): boolean {
    const control = this.form().controls[name];
    return control.invalid && control.touched;
  }
}
