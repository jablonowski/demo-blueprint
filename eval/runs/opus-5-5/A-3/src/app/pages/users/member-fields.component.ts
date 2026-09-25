import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { USER_ROLES } from '../../core/user.model';
import { MemberForm } from './member-form';

/** First/last name, email and role fields shared by the edit and invite dialogs. */
@Component({
  selector: 'app-member-fields',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  host: { class: 'member-fields' },
  template: `
    <ng-container [formGroup]="form()">
      <div class="field-row">
        <div class="field" [class.field--invalid]="invalid('firstName')">
          <label class="field__label" [for]="idPrefix() + '-first'">First name</label>
          <input class="field__control" [id]="idPrefix() + '-first'" formControlName="firstName" autocomplete="given-name" />
          @if (invalid('firstName')) { <span class="field__error">First name is required.</span> }
        </div>
        <div class="field" [class.field--invalid]="invalid('lastName')">
          <label class="field__label" [for]="idPrefix() + '-last'">Last name</label>
          <input class="field__control" [id]="idPrefix() + '-last'" formControlName="lastName" autocomplete="family-name" />
          @if (invalid('lastName')) { <span class="field__error">Last name is required.</span> }
        </div>
      </div>

      <div class="field" [class.field--invalid]="invalid('email')">
        <label class="field__label" [for]="idPrefix() + '-email'">Email address</label>
        <input class="field__control" type="email" [id]="idPrefix() + '-email'" formControlName="email" autocomplete="email" />
        @if (invalid('email')) {
          <span class="field__error">
            {{ form().controls.email.hasError('required') ? 'Email address is required.' : 'Enter a valid email address.' }}
          </span>
        }
      </div>

      <div class="field" [class.field--invalid]="invalid('role')">
        <label class="field__label" [for]="idPrefix() + '-role'">Role</label>
        <select
          class="field__control"
          [class.is-placeholder]="!form().controls.role.value"
          [id]="idPrefix() + '-role'"
          formControlName="role"
        >
          <option value="" disabled>{{ rolePlaceholder() }}</option>
          @for (role of roles; track role) {
            <option [value]="role">{{ role }}</option>
          }
        </select>
        @if (invalid('role')) { <span class="field__error">Role is required.</span> }
      </div>
    </ng-container>
  `,
  styles: `
    :host { display: contents; }
  `,
})
export class MemberFieldsComponent {
  readonly form = input.required<MemberForm>();
  readonly idPrefix = input.required<string>();
  readonly rolePlaceholder = input('Select role…');

  protected readonly roles = USER_ROLES;

  protected invalid(name: keyof MemberForm['controls']): boolean {
    const c = this.form().controls[name];
    return c.invalid && c.touched;
  }
}
