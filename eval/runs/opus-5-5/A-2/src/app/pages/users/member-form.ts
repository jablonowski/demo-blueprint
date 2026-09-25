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
