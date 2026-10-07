export type UserRole = 'Admin' | 'Editor' | 'Viewer';
export type UserStatus = 'Active' | 'Inactive';

export const USER_ROLES: readonly UserRole[] = ['Admin', 'Editor', 'Viewer'];

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  /** ISO date, yyyy-MM-dd */
  joinedDate: string;
}

export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
