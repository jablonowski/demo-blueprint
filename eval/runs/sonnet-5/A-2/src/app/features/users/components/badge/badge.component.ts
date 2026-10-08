import { Component, Input } from '@angular/core';
import { UserRole, UserStatus } from '../../../../core/models/user.model';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const ROLE_TONE: Record<UserRole, Tone> = {
  Admin: 'danger',
  Editor: 'info',
  Viewer: 'neutral'
};

const STATUS_TONE: Record<UserStatus, Tone> = {
  Active: 'success',
  Inactive: 'neutral'
};

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [],
  templateUrl: './badge.component.html'
})
export class BadgeComponent {
  @Input() role?: UserRole;
  @Input() status?: UserStatus;
  @Input() tone?: Tone;
  @Input() label?: string;

  get resolvedTone(): Tone {
    if (this.tone) return this.tone;
    if (this.role) return ROLE_TONE[this.role];
    if (this.status) return STATUS_TONE[this.status];
    return 'neutral';
  }

  get text(): string {
    return this.label ?? this.role ?? this.status ?? '';
  }
}
