import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** Circular avatar: shows the image when it loads, the name's initials otherwise. */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"avatar avatar--" + size()' },
  template: `
    @if (src() && !failed()) {
      <img [src]="src()" [alt]="name()" (error)="failed.set(true)" />
    } @else {
      <span aria-hidden="true">{{ initials() }}</span>
      <span class="visually-hidden">{{ name() }}</span>
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
      background: var(--color-bg-avatar);
      color: var(--color-fg-secondary);
      font-weight: var(--weight-semibold);
      line-height: 1;
    }
    :host(.avatar--sm) { width: var(--avatar-sm); height: var(--avatar-sm); font-size: var(--text-sm); }
    :host(.avatar--md) { width: var(--avatar-md); height: var(--avatar-md); font-size: var(--text-base); }
    img { width: 100%; height: 100%; object-fit: cover; }
  `,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly src = input<string | null>(null);
  readonly size = input<'sm' | 'md'>('sm');

  readonly initials = computed(() => initialsOf(this.name()));
  /** Resets whenever the source changes. */
  readonly failed = linkedSignal({ source: this.src, computation: () => false });
}
