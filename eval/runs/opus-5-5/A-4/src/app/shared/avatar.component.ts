import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { initialsOf } from '../core/user.model';

/** Circular avatar: shows the image when it loads, otherwise the name's initials. */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.avatar--md]': 'size() === "md"' },
  template: `
    @if (src() && !failed()) {
      <img [src]="src()" [alt]="name()" (error)="failed.set(true)" />
    } @else {
      <span aria-hidden="true">{{ initials() }}</span>
      <span class="sr-only">{{ name() }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: var(--size-avatar-sm);
      height: var(--size-avatar-sm);
      border-radius: var(--radius-full);
      background: var(--color-gray-150);
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      overflow: hidden;
      position: relative;
    }
    :host(.avatar--md) {
      width: var(--size-avatar-md);
      height: var(--size-avatar-md);
      font-size: var(--font-size-base);
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly src = input<string | null | undefined>(null);
  readonly size = input<'sm' | 'md'>('sm');

  protected readonly failed = signal(false);
  protected readonly initials = computed(() => initialsOf(this.name()));
}
