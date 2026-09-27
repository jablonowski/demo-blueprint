import { FormBuilder, Validators } from '@angular/forms';
import { UserRole } from '../../../core/models/user.model';

export function splitName(fullName: string): { firstName: string; lastName: string } {
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  return { firstName: firstName ?? '', lastName: rest.join(' ') };
}

export function joinName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function createMemberForm(fb: FormBuilder) {
  return fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['' as UserRole | '', Validators.required]
  });
}

export type MemberForm = ReturnType<typeof createMemberForm>;

export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Editor', label: 'Editor' },
  { value: 'Viewer', label: 'Viewer' }
];

export function formatJoinedMonthYear(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function roleTagVariant(role: UserRole): 'danger' | 'info' | 'default' {
  switch (role) {
    case 'Admin':
      return 'danger';
    case 'Editor':
      return 'info';
    default:
      return 'default';
  }
}

export function statusTagVariant(status: string): 'success' | 'default' {
  return status === 'Active' ? 'success' : 'default';
}
