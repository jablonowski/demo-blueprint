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

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function roleTag(role: Role): string {
  return { Admin: 'tag-danger', Editor: 'tag-info', Viewer: 'tag-default' }[role];
}

export function statusTag(status: Status): string {
  return status === 'Active' ? 'tag-success' : 'tag-default';
}
