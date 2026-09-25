export type UserRole = 'Admin' | 'Editor' | 'Viewer';
export type UserStatus = 'Active' | 'Inactive';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  joinedDate: string;
}

export const USER_ROLES: UserRole[] = ['Admin', 'Editor', 'Viewer'];

export const ROLE_TAG: Record<UserRole, string> = {
  Admin: 'tag-info',
  Editor: 'tag-warning',
  Viewer: 'tag-default',
};

export const STATUS_TAG: Record<UserStatus, string> = {
  Active: 'tag-success',
  Inactive: 'tag-default',
};

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}
