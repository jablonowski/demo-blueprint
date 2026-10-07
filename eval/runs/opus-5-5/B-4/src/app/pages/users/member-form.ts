import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DropdownOption } from '@jablonowski/dsb-components';

import { USER_ROLES, User, UserRole } from '../../core/user.model';

export type MemberForm = FormGroup<{
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  role: FormControl<UserRole | ''>;
}>;

export const ROLE_OPTIONS: DropdownOption[] = USER_ROLES.map((role) => ({ value: role, label: role }));

export function createMemberForm(): MemberForm {
  return new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    lastName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl<UserRole | ''>('', { nonNullable: true, validators: Validators.required }),
  });
}

/** "Mary Ann Smith" → { first: "Mary", last: "Ann Smith" }. */
export function splitName(name: string): { first: string; last: string } {
  const [first = '', ...rest] = name.trim().split(/\s+/);
  return { first, last: rest.join(' ') };
}

export function joinName(first: string, last: string): string {
  return `${first.trim()} ${last.trim()}`.trim();
}

export function memberFormValue(user: User) {
  const { first, last } = splitName(user.name);
  return { firstName: first, lastName: last, email: user.email, role: user.role };
}
