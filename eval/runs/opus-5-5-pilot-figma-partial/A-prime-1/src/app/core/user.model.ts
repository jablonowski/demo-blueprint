export type Role = 'Admin' | 'Editor' | 'Viewer';
export type Status = 'Active' | 'Inactive';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  status: Status;
  joinedDate: string;
}

export const ROLES: Role[] = ['Admin', 'Editor', 'Viewer'];

export const ROLE_TAG: Record<Role, string> = {
  Admin: 'tag-info',
  Editor: 'tag-warning',
  Viewer: 'tag-default',
};

export const STATUS_TAG: Record<Status, string> = {
  Active: 'tag-success',
  Inactive: 'tag-default',
};

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
