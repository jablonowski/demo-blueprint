export type UserRole = 'Admin' | 'Editor' | 'Viewer';
export type UserStatus = 'Active' | 'Inactive';
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

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

export function roleTone(role: UserRole): Tone {
  switch (role) {
    case 'Admin':
      return 'danger';
    case 'Editor':
      return 'info';
    case 'Viewer':
      return 'neutral';
  }
}

export function statusTone(status: UserStatus): Tone {
  return status === 'Active' ? 'success' : 'neutral';
}

export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' ')
  };
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatJoinedMonthYear(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
