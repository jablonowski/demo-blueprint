import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DropdownComponent, InputComponent } from '@jablonowski/dsb-components';

import { MemberForm, ROLE_OPTIONS } from './member-form';

/** The editable member fields shared by the edit and invite dialogs. */
@Component({
  selector: 'app-member-fields',
  imports: [ReactiveFormsModule, InputComponent, DropdownComponent],
  template: `
    <div class="fields" [formGroup]="form()">
      <div class="two-col">
        <dsb-input
          formControlName="firstName"
          label="First name"
          placeholder="First name"
          [hasError]="invalid('firstName')"
          errorMessage="First name is required"
        />
        <dsb-input
          formControlName="lastName"
          label="Last name"
          placeholder="Last name"
          [hasError]="invalid('lastName')"
          errorMessage="Last name is required"
        />
      </div>
      <dsb-input
        formControlName="email"
        type="email"
        label="Email address"
        placeholder="name@example.com"
        [hasError]="invalid('email')"
        [errorMessage]="form().controls.email.hasError('required') ? 'Email address is required' : 'Enter a valid email address'"
      />
      <dsb-dropdown
        formControlName="role"
        label="Role"
        [placeholder]="rolePlaceholder()"
        [options]="roleOptions"
        [hasError]="invalid('role')"
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
      gap: var(--ds-decisions-space-xl);
    }

    @media (max-width: 480px) {
      .two-col {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
})
export class MemberFieldsComponent {
  readonly form = input.required<MemberForm>();
  /** Set once the user has tried to submit, so untouched fields report too. */
  readonly submitted = input(false);
  readonly rolePlaceholder = input('Select role…');

  readonly roleOptions = ROLE_OPTIONS;

  invalid(name: 'firstName' | 'lastName' | 'email' | 'role'): boolean {
    const control = this.form().controls[name];
    return control.invalid && (control.touched || this.submitted());
  }
}
