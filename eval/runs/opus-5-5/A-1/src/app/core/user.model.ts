export type Role = 'Admin' | 'Editor' | 'Viewer';
export type Status = 'Active' | 'Inactive';

export const ROLES: Role[] = ['Admin', 'Editor', 'Viewer'];

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  status: Status;
  joinedDate: string;
}
