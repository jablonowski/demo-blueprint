import { Role, Status } from '../core/user.model';
import { Tone } from './badge.component';

/** Badge tones per role and status, as drawn in the Figma "Users Table" frame. */
export const ROLE_TONE: Record<Role, Tone> = {
  Admin: 'danger',
  Editor: 'info',
  Viewer: 'neutral',
};

export const STATUS_TONE: Record<Status, Tone> = {
  Active: 'success',
  Inactive: 'neutral',
};
