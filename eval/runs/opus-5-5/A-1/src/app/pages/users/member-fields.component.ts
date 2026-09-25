import { Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ROLES, Role } from '../../core/user.model';

export type MemberForm = FormGroup<{
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  role: FormControl<Role | ''>;
}>;

/** First/last name, email and role — shared by the edit and invite dialogs. */
@Component({
  selector: 'app-member-fields',
  imports: [ReactiveFormsModule],
  template: `
    <ng-container [formGroup]="form()">
      <div class="field-row">
        <div class="field">
          <label class="field-label" [for]="idPrefix() + '-first'">First name</label>
          <input class="input" [id]="idPrefix() + '-first'" formControlName="firstName" autocomplete="given-name"
                 [class.is-invalid]="invalid('firstName')" />
          @if (invalid('firstName')) { <span class="field-error">First name is required</span> }
        </div>
        <div class="field">
          <label class="field-label" [for]="idPrefix() + '-last'">Last name</label>
          <input class="input" [id]="idPrefix() + '-last'" formControlName="lastName" autocomplete="family-name"
                 [class.is-invalid]="invalid('lastName')" />
          @if (invalid('lastName')) { <span class="field-error">Last name is required</span> }
        </div>
      </div>

      <div class="field">
        <label class="field-label" [for]="idPrefix() + '-email'">Email address</label>
        <input class="input" type="email" [id]="idPrefix() + '-email'" formControlName="email" autocomplete="email"
               [class.is-invalid]="invalid('email')" />
        @if (invalid('email')) {
          <span class="field-error">
            {{ form().controls.email.hasError('required') ? 'Email address is required' : 'Enter a valid email address' }}
          </span>
        }
      </div>

      <div class="field">
        <label class="field-label" [for]="idPrefix() + '-role'">Role</label>
        <select class="input" [id]="idPrefix() + '-role'" formControlName="role"
                [class.is-invalid]="invalid('role')" [class.is-placeholder]="!form().controls.role.value">
          @if (rolePlaceholder()) {
            <option value="" disabled>{{ rolePlaceholder() }}</option>
          }
          @for (r of roles; track r) {
            <option [value]="r">{{ r }}</option>
          }
        </select>
        @if (invalid('role')) { <span class="field-error">Role is required</span> }
      </div>
    </ng-container>
  `,
  styles: `:host { display: contents; }`,
})
export class MemberFieldsComponent {
  readonly form = input.required<MemberForm>();
  readonly idPrefix = input.required<string>();
  readonly rolePlaceholder = input<string>('');

  protected readonly roles = ROLES;

  protected invalid(name: keyof MemberForm['controls']): boolean {
    const c = this.form().controls[name];
    return c.invalid && c.touched;
  }
}
