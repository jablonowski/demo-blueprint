import { Component, computed, input, signal } from '@angular/core';

import { initials } from '../../core/user.model';

/** Circular avatar: shows the image when it loads, otherwise the name's initials. */
@Component({
  selector: 'app-avatar',
  template: `
    @if (src() && !failed()) {
      <img [src]="src()" [alt]="name()" (error)="failed.set(true)" />
    } @else {
      <span aria-hidden="true">{{ letters() }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: var(--avatar-size, 32px);
      height: var(--avatar-size, 32px);
      border-radius: 50%;
      overflow: hidden;
      background: var(--color-surface-recessed);
      color: var(--color-text-secondary);
      font-size: var(--avatar-font-size, var(--font-size-sm));
      font-weight: var(--font-weight-semibold);
    }
    img { width: 100%; height: 100%; object-fit: cover; }
  `,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly src = input<string | null>(null);

  readonly failed = signal(false);
  readonly letters = computed(() => initials(this.name()));
}
