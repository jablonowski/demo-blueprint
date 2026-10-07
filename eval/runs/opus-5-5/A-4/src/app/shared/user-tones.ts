import { UserRole, UserStatus } from '../core/user.model';
import { BadgeTone } from './badge.component';

/** Badge tones per role / status, as shown in the Figma "Users Table" frame. */
export const ROLE_TONE: Record<UserRole, BadgeTone> = {
  Admin: 'danger',
  Editor: 'info',
  Viewer: 'neutral',
};

export const STATUS_TONE: Record<UserStatus, BadgeTone> = {
  Active: 'success',
  Inactive: 'neutral',
};
