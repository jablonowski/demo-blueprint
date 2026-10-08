import { TagVariant } from '@jablonowski/dsb-components';
import { UserRole, UserStatus } from '../models/user.model';

export function roleVariant(role: UserRole): TagVariant {
  switch (role) {
    case 'Admin':
      return 'danger';
    case 'Editor':
      return 'info';
    default:
      return 'default';
  }
}

export function statusVariant(status: UserStatus): TagVariant {
  return status === 'Active' ? 'success' : 'default';
}
