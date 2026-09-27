import { Component, computed, input, signal } from '@angular/core';

/** Circular avatar: shows the image when it loads, the name's initials otherwise. */
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
      flex: none;
      width: var(--avatar-size, 32px);
      height: var(--avatar-size, 32px);
      border-radius: 50%;
      overflow: hidden;
      background: var(--color-surface-recessed);
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
    }
    :host(.lg) { --avatar-size: 40px; font-size: var(--font-size-base); }
    img { width: 100%; height: 100%; object-fit: cover; }
  `,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly src = input<string>();

  readonly failed = signal(false);
  readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join(''),
  );
}
