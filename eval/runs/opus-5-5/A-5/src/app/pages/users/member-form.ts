import { FormControl, FormGroup, Validators } from '@angular/forms';

import { Role } from '../../core/user.model';

export type MemberForm = FormGroup<{
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  role: FormControl<Role | ''>;
}>;

export function createMemberForm(): MemberForm {
  return new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    lastName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl<Role | ''>('', { nonNullable: true, validators: Validators.required }),
  });
}

/** "Mary Ann Smith" → { first: "Mary Ann", last: "Smith" } */
export function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) {
    return { first: parts[0] ?? '', last: '' };
  }
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}

export function joinName(first: string, last: string): string {
  return `${first.trim()} ${last.trim()}`.trim();
}
