import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { initialsOf } from './user-tones';

/** Circular avatar. Shows the image when given one that loads, otherwise the initials. */
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
      width: var(--size-avatar-sm);
      height: var(--size-avatar-sm);
      border-radius: var(--radius-full);
      overflow: hidden;
      background: var(--color-bg-avatar);
      color: var(--color-fg-secondary);
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
    }
    :host(.size-md) {
      width: var(--size-avatar-md);
      height: var(--size-avatar-md);
      font-size: var(--text-base);
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
  host: { '[class.size-md]': 'size() === "md"', '[attr.title]': 'name()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly src = input<string | null>(null);
  readonly size = input<'sm' | 'md'>('sm');

  protected readonly failed = signal(false);
  protected readonly initials = computed(() => initialsOf(this.name()));
}
