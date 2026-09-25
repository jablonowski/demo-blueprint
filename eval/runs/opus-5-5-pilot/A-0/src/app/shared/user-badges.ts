import { UserRole, UserStatus } from '../core/user.model';
import { BadgeTone } from './badge.component';

const ROLE_TONES: Record<UserRole, BadgeTone> = {
  Admin: 'primary',
  Editor: 'info',
  Viewer: 'neutral',
};

const STATUS_TONES: Record<UserStatus, BadgeTone> = {
  Active: 'success',
  Inactive: 'neutral',
};

export const roleTone = (role: UserRole): BadgeTone => ROLE_TONES[role] ?? 'neutral';
export const statusTone = (status: UserStatus): BadgeTone => STATUS_TONES[status] ?? 'neutral';
