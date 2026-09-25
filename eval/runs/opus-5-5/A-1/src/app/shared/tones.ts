import { Role, Status } from '../core/user.model';

/** Badge tone per role and status, as toned in the Figma users table. */
export const ROLE_TONE: Record<Role, string> = {
  Admin: 'badge-negative',
  Editor: 'badge-info',
  Viewer: 'badge-neutral',
};

export const STATUS_TONE: Record<Status, string> = {
  Active: 'badge-positive',
  Inactive: 'badge-neutral',
};
