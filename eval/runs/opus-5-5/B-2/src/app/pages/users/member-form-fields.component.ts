import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DropdownComponent, DropdownOption, InputComponent } from '@jablonowski/dsb-components';

import { USER_ROLES } from '../../core/user.model';
import { MemberForm } from './member-form';

/** Name, email and role fields shared by the edit and invite dialogs. */
@Component({
  selector: 'app-member-form-fields',
  imports: [ReactiveFormsModule, InputComponent, DropdownComponent],
  template: `
    <ng-container [formGroup]="form()">
      <div class="name-row">
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
        [errorMessage]="form().controls.email.hasError('email') ? 'Enter a valid email address' : 'Email address is required'"
      />
      <dsb-dropdown
        formControlName="role"
        label="Role"
        [placeholder]="rolePlaceholder()"
        [options]="roleOptions"
        [hasError]="invalid('role')"
        errorMessage="Role is required"
      />
    </ng-container>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--ds-decisions-space-xl);
    }

    .name-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--ds-decisions-space-xl);
    }
  `,
})
export class MemberFormFieldsComponent {
  readonly form = input.required<MemberForm>();
  readonly rolePlaceholder = input('Select role…');

  readonly roleOptions: DropdownOption[] = USER_ROLES.map((role) => ({ value: role, label: role }));

  invalid(name: keyof MemberForm['controls']): boolean {
    const control = this.form().controls[name];
    return control.invalid && control.touched;
  }
}
