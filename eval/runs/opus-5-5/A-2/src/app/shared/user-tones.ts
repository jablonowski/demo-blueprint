import { UserRole, UserStatus } from '../core/user.model';
import { BadgeTone } from './badge.component';

/** Role and status tones, as the Figma "Users Table" frame colours them. */
export const ROLE_TONE: Record<UserRole, BadgeTone> = {
  Admin: 'danger',
  Editor: 'info',
  Viewer: 'neutral',
};

export const STATUS_TONE: Record<UserStatus, BadgeTone> = {
  Active: 'success',
  Inactive: 'neutral',
};

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

export function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}
