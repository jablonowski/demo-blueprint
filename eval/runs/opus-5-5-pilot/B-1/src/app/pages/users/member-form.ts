import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DropdownOption, TagVariant } from '@jablonowski/dsb-components';
import { UserRole, UserStatus } from '../../core/user.model';

export type MemberForm = FormGroup<{
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  role: FormControl<UserRole | ''>;
}>;

export function createMemberForm(): MemberForm {
  return new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl<UserRole | ''>('', { nonNullable: true, validators: [Validators.required] }),
  });
}

export const ROLE_OPTIONS: DropdownOption[] = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Editor', label: 'Editor' },
  { value: 'Viewer', label: 'Viewer' },
];

export const ROLE_VARIANT: Record<UserRole, TagVariant> = {
  Admin: 'primary',
  Editor: 'info',
  Viewer: 'default',
};

export const STATUS_VARIANT: Record<UserStatus, TagVariant> = {
  Active: 'success',
  Inactive: 'default',
};

export function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

export function joinName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

/** "2024-01-15" → "January 2024", parsed as a local date so the month never shifts. */
export function memberSince(isoDate: string): string {
  const [year, month] = isoDate.split('-').map(Number);
  if (!year || !month) {
    return isoDate;
  }
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
