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
  /** ISO date, `YYYY-MM-DD`. */
  joinedDate: string;
}
