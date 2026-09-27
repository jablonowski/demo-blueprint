import { UserRole, UserStatus } from '../../core/models/user.model';

export function roleTagClass(role: UserRole): string {
  switch (role) {
    case 'Admin':
      return 'tag-danger';
    case 'Editor':
      return 'tag-info';
    case 'Viewer':
    default:
      return 'tag-default';
  }
}

export function statusTagClass(status: UserStatus): string {
  return status === 'Active' ? 'tag-success' : 'tag-default';
}
