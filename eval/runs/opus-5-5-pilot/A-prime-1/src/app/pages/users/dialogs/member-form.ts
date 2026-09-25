import { FormBuilder, Validators } from '@angular/forms';

import { UserRole } from '../../../core/user.model';

export function buildMemberForm(fb: FormBuilder) {
  return fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['' as UserRole | '', Validators.required],
  });
}

export type MemberForm = ReturnType<typeof buildMemberForm>;
