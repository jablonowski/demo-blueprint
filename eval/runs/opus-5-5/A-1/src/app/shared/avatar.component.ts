import { Component, computed, input, signal } from '@angular/core';

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');
}

/** Circular avatar: shows the image when it loads, otherwise the initials. */
@Component({
  selector: 'app-avatar',
  template: `
    @if (src() && !failed()) {
      <img [src]="src()" [alt]="name()" (error)="failed.set(true)" />
    } @else {
      <span aria-hidden="true">{{ initials() }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: var(--avatar-sm);
      height: var(--avatar-sm);
      border-radius: var(--radius-full);
      background: var(--c-avatar-bg);
      color: var(--c-fg-muted);
      font-size: var(--fs-sm);
      font-weight: var(--fw-semibold);
      overflow: hidden;
    }
    :host(.md) { width: var(--avatar-md); height: var(--avatar-md); font-size: var(--fs-base); }
    img { width: 100%; height: 100%; object-fit: cover; }
  `,
  host: { '[class.md]': "size() === 'md'" },
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly src = input<string>();
  readonly size = input<'sm' | 'md'>('sm');

  protected readonly failed = signal(false);
  protected readonly initials = computed(() => initialsOf(this.name()));
}
