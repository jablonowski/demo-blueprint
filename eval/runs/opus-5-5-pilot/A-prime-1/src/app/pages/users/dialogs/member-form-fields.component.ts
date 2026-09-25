import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { USER_ROLES } from '../../../core/user.model';
import { MemberForm } from './member-form';

/** First/last name, email and role controls shared by the edit and invite dialogs. */
@Component({
  selector: 'app-member-form-fields',
  imports: [ReactiveFormsModule],
  templateUrl: './member-form-fields.component.html',
  styles: `:host { display: flex; flex-direction: column; gap: 16px; }`,
})
export class MemberFormFieldsComponent {
  readonly form = input.required<MemberForm>();
  readonly submitted = input(false);
  readonly idPrefix = input('member');
  readonly roles = USER_ROLES;

  invalid(name: keyof MemberForm['controls']): boolean {
    const control = this.form().controls[name];
    return control.invalid && (control.touched || this.submitted());
  }
}
