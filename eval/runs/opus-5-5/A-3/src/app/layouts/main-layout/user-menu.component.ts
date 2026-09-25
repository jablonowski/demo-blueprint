import { ChangeDetectionStrategy, Component, ElementRef, inject, input, output, signal } from '@angular/core';
import { AvatarComponent } from '../../shared/avatar.component';

/**
 * Avatar + name trigger with a dropdown. The panel is anchored to the trigger's
 * right edge so it always opens leftward and stays inside the viewport.
 */
@Component({
  selector: 'app-user-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarComponent],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'open.set(false)',
  },
  template: `
    <button
      type="button"
      class="trigger"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
      (click)="open.set(!open())"
    >
      <app-avatar [name]="name()" size="sm" />
      <span class="trigger__name">{{ name() }}</span>
      <svg class="trigger__chevron" [class.is-open]="open()" viewBox="0 0 10 6" aria-hidden="true">
        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    @if (open()) {
      <div class="menu" role="menu">
        <button type="button" class="menu__item" role="menuitem" (click)="open.set(false)">My Profile</button>
        <div class="menu__divider" role="separator"></div>
        <button type="button" class="menu__item menu__item--danger" role="menuitem" (click)="choose()">Sign Out</button>
      </div>
    }
  `,
  styles: `
    :host { position: relative; display: inline-flex; }
    .trigger {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-2) var(--space-1) var(--space-1);
      border: 0;
      border-radius: var(--radius-full);
      background: transparent;
      cursor: pointer;
    }
    .trigger:hover { background: var(--surface-hover); }
    .trigger:focus-visible { outline: none; box-shadow: var(--focus-ring); }
    .trigger__name { font-size: var(--text-md); font-weight: var(--weight-medium); color: var(--text-primary); }
    .trigger__chevron {
      width: var(--size-icon-xs);
      aspect-ratio: 10 / 6;
      color: var(--text-muted);
      transition: transform var(--duration-fast) var(--easing-standard);
    }
    .trigger__chevron.is-open { transform: rotate(180deg); }
    .menu {
      position: absolute;
      top: calc(100% + var(--space-2));
      right: 0;
      z-index: var(--z-menu);
      width: var(--size-menu);
      max-width: calc(100vw - var(--space-8));
      padding: var(--space-1);
      background: var(--surface-card);
      border: var(--border-width) solid var(--border-default);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-overlay);
    }
    .menu__item {
      display: block;
      width: 100%;
      padding: var(--space-2) var(--space-3);
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      font-size: var(--text-md);
      text-align: left;
      color: var(--text-primary);
      cursor: pointer;
    }
    .menu__item:hover, .menu__item:focus-visible { outline: none; background: var(--surface-hover); }
    .menu__item--danger { color: var(--text-danger); }
    .menu__divider { height: var(--border-width); margin: var(--space-1) 0; background: var(--border-divider); }
    @media (max-width: 640px) {
      .trigger__name { display: none; }
    }
  `,
})
export class UserMenuComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly name = input.required<string>();
  readonly signOut = output<void>();

  protected readonly open = signal(false);

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  protected choose(): void {
    this.open.set(false);
    this.signOut.emit();
  }
}
