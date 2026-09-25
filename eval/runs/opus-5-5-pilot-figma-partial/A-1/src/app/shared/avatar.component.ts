import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

@Component({
  selector: 'app-avatar',
  template: `
    @if (src() && !failed()) {
      <img [src]="src()" [alt]="name()" (error)="failed.set(true)" />
    } @else {
      <span aria-hidden="true">{{ initials() }}</span>
    }
  `,
  host: { '[class]': '"avatar avatar--" + size()', '[attr.title]': 'name()' },
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: var(--radius-full);
      background: var(--color-bg-avatar);
      color: var(--color-text-secondary);
      font-weight: var(--weight-semibold);
    }
    :host(.avatar--sm) { width: var(--size-avatar-sm); height: var(--size-avatar-sm); font-size: var(--text-sm); }
    :host(.avatar--md) { width: var(--size-avatar-md); height: var(--size-avatar-md); font-size: var(--text-md); }
    img { width: 100%; height: 100%; object-fit: cover; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly src = input<string | null>(null);
  readonly size = input<'sm' | 'md'>('sm');

  protected readonly failed = signal(false);
  protected readonly initials = computed(() => initialsOf(this.name()));
}
