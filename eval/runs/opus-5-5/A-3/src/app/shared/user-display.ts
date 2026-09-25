import { UserRole, UserStatus } from '../core/user.model';
import { BadgeTone } from './badge.component';

export const ROLE_TONE: Record<UserRole, BadgeTone> = {
  Admin: 'negative',
  Editor: 'info',
  Viewer: 'neutral',
};

export const STATUS_TONE: Record<UserStatus, BadgeTone> = {
  Active: 'positive',
  Inactive: 'neutral',
};

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

/** `2024-01-15` → `January 2024`, parsed as a calendar date (no timezone shift). */
export function monthYear(isoDate: string): string {
  const [y, m] = isoDate.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** `2024-01-15` → `Jan 2024`, the table's "Joined" format. */
export function joinedLabel(isoDate: string): string {
  const [y, m] = isoDate.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
