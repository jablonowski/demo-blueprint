import { Component, computed, input, signal } from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-avatar',
  template: `
    <span class="avatar avatar--{{ size() }}">
      @if (src() && !failed()) {
        <img [src]="src()" [alt]="name()" (error)="failed.set(true)" />
      } @else {
        {{ initials() }}
      }
    </span>
  `,
  styles: `
    .avatar {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: var(--radius-full);
      background: var(--color-bg-muted);
      color: var(--color-fg);
      font-weight: var(--weight-medium);
      text-transform: uppercase;
    }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .avatar--sm { width: var(--avatar-sm); height: var(--avatar-sm); font-size: var(--text-xs); }
    .avatar--md { width: var(--avatar-md); height: var(--avatar-md); font-size: var(--text-sm); }
    .avatar--lg { width: var(--avatar-lg); height: var(--avatar-lg); font-size: var(--text-base); }
  `,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly src = input<string>();
  readonly size = input<AvatarSize>('sm');

  protected readonly failed = signal(false);
  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join(''),
  );
}
