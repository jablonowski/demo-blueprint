import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';

import { ROLES } from '../../core/user.model';
import { MemberForm } from './member-form';

/** First/last name, email and role — shared by the edit and invite dialogs. */
@Component({
  selector: 'app-member-fields',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  host: { class: 'member-fields' },
  template: `
    <ng-container [formGroup]="form()">
      <div class="field-grid">
        <div class="field" [class.field--invalid]="invalid(form().controls.firstName)">
          <label class="field__label" [for]="idPrefix() + '-first'">First name</label>
          <input class="field__control" [id]="idPrefix() + '-first'" formControlName="firstName" placeholder="First name" />
          @if (invalid(form().controls.firstName)) {
            <span class="field__error">First name is required.</span>
          }
        </div>
        <div class="field" [class.field--invalid]="invalid(form().controls.lastName)">
          <label class="field__label" [for]="idPrefix() + '-last'">Last name</label>
          <input class="field__control" [id]="idPrefix() + '-last'" formControlName="lastName" placeholder="Last name" />
          @if (invalid(form().controls.lastName)) {
            <span class="field__error">Last name is required.</span>
          }
        </div>
      </div>

      <div class="field" [class.field--invalid]="invalid(form().controls.email)">
        <label class="field__label" [for]="idPrefix() + '-email'">Email address</label>
        <input class="field__control" type="email" [id]="idPrefix() + '-email'" formControlName="email" placeholder="name@example.com" />
        @if (invalid(form().controls.email)) {
          <span class="field__error">
            {{ form().controls.email.hasError('required') ? 'Email address is required.' : 'Enter a valid email address.' }}
          </span>
        }
      </div>

      <div class="field" [class.field--invalid]="invalid(form().controls.role)">
        <label class="field__label" [for]="idPrefix() + '-role'">Role</label>
        <select
          class="field__control"
          [class.is-placeholder]="!form().controls.role.value"
          [id]="idPrefix() + '-role'"
          formControlName="role"
        >
          <option value="" disabled>Select role…</option>
          @for (role of roles; track role) {
            <option [value]="role">{{ role }}</option>
          }
        </select>
        @if (invalid(form().controls.role)) {
          <span class="field__error">Role is required.</span>
        }
      </div>
    </ng-container>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
  `,
})
export class MemberFieldsComponent {
  readonly form = input.required<MemberForm>();
  readonly idPrefix = input.required<string>();
  readonly roles = ROLES;

  invalid(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }
}
