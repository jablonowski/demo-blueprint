import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { USER_ROLES } from '../../core/user.model';
import { MemberForm } from './member-form';

/** First/last name, email and role fields shared by the edit and invite dialogs. */
@Component({
  selector: 'app-member-form-fields',
  imports: [ReactiveFormsModule],
  template: `
    <ng-container [formGroup]="form()">
      <div class="field-row">
        <div class="field" [class.field--error]="invalid('firstName')">
          <label class="field__label" [for]="idPrefix() + '-first'">First name</label>
          <input class="field__control" [id]="idPrefix() + '-first'" formControlName="firstName" placeholder="First name" />
          @if (invalid('firstName')) {
            <span class="field__error">First name is required</span>
          }
        </div>
        <div class="field" [class.field--error]="invalid('lastName')">
          <label class="field__label" [for]="idPrefix() + '-last'">Last name</label>
          <input class="field__control" [id]="idPrefix() + '-last'" formControlName="lastName" placeholder="Last name" />
          @if (invalid('lastName')) {
            <span class="field__error">Last name is required</span>
          }
        </div>
      </div>

      <div class="field" [class.field--error]="invalid('email')">
        <label class="field__label" [for]="idPrefix() + '-email'">Email address</label>
        <input
          class="field__control"
          [id]="idPrefix() + '-email'"
          type="email"
          formControlName="email"
          placeholder="name@example.com"
        />
        @if (invalid('email')) {
          <span class="field__error">
            {{ form().controls.email.hasError('email') ? 'Enter a valid email address' : 'Email address is required' }}
          </span>
        }
      </div>

      <div class="field" [class.field--error]="invalid('role')">
        <label class="field__label" [for]="idPrefix() + '-role'">Role</label>
        <select
          class="field__control"
          [id]="idPrefix() + '-role'"
          formControlName="role"
          [class.is-placeholder]="!form().controls.role.value"
        >
          @if (rolePlaceholder()) {
            <option value="" disabled>{{ rolePlaceholder() }}</option>
          }
          @for (role of roles; track role) {
            <option [value]="role">{{ role }}</option>
          }
        </select>
        @if (invalid('role')) {
          <span class="field__error">Role is required</span>
        }
      </div>
    </ng-container>
  `,
  styles: `
    :host {
      display: contents;
    }
    option {
      color: var(--color-fg);
    }
  `,
  changeDetection: ChangeDetectionStrategy.Default,
})
export class MemberFormFieldsComponent {
  readonly form = input.required<MemberForm>();
  readonly idPrefix = input.required<string>();
  readonly rolePlaceholder = input<string>('');

  protected readonly roles = USER_ROLES;

  protected invalid(name: keyof MemberForm['controls']): boolean {
    const control = this.form().controls[name];
    return control.invalid && control.touched;
  }
}
