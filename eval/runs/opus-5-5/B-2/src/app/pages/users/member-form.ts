import { FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';

import { UserRole } from '../../core/user.model';

export type MemberForm = FormGroup<{
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  role: FormControl<UserRole | ''>;
}>;

export function createMemberForm(fb: NonNullableFormBuilder): MemberForm {
  return fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: fb.control<UserRole | ''>('', Validators.required),
  });
}

/** "Mary Ann Smith" → first "Mary Ann", last "Smith". */
export function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) {
    return { firstName: parts[0] ?? '', lastName: '' };
  }
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

export function joinName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}
