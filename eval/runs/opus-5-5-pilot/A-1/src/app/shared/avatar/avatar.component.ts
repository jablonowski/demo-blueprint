import { Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-avatar',
  template: `
    @if (src() && !failed()) {
      <img [src]="src()" [alt]="name()" (error)="failed.set(true)" />
    } @else {
      <span>{{ initials() }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: var(--avatar-sm);
      height: var(--avatar-sm);
      border-radius: var(--radius-full);
      overflow: hidden;
      background: var(--bg-muted);
      color: var(--fg-default);
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
    }
    :host(.avatar--md) { width: var(--avatar-md); height: var(--avatar-md); font-size: var(--text-sm); }
    :host(.avatar--lg) { width: var(--avatar-lg); height: var(--avatar-lg); font-size: var(--text-base); }
    img { width: 100%; height: 100%; object-fit: cover; }
  `,
  host: {
    '[class.avatar--md]': "size() === 'md'",
    '[class.avatar--lg]': "size() === 'lg'"
  }
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly src = input<string | null>(null);
  readonly size = input<'sm' | 'md' | 'lg'>('sm');
  protected readonly failed = signal(false);
  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('')
  );
}
