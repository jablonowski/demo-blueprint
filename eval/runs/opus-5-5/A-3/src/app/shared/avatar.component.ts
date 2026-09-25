import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { initialsOf } from './user-display';

/** Circular avatar: shows the image when given and loadable, otherwise initials. */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"avatar avatar--" + size()', '[attr.aria-label]': 'name()', role: 'img' },
  template: `
    @if (src() && !failed()) {
      <img [src]="src()" alt="" (error)="failed.set(true)" />
    } @else {
      <span aria-hidden="true">{{ initials() }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: var(--radius-full);
      background: var(--avatar-bg);
      color: var(--avatar-fg);
      font-weight: var(--weight-semibold);
      line-height: var(--leading-none);
      user-select: none;
    }
    :host(.avatar--sm) { width: var(--size-avatar-sm); height: var(--size-avatar-sm); font-size: var(--text-sm); }
    :host(.avatar--md) { width: var(--size-avatar-md); height: var(--size-avatar-md); font-size: var(--text-base); }
    img { width: 100%; height: 100%; object-fit: cover; }
  `,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly src = input<string | null | undefined>(null);
  readonly size = input<'sm' | 'md'>('sm');

  protected readonly failed = signal(false);
  protected readonly initials = computed(() => initialsOf(this.name()));
}
