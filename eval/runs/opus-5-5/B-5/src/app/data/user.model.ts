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
