import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { AvatarComponent } from '@jablonowski/dsb-components';

/**
 * Profile control for the top-right of the header. The design system's header has no
 * slot for it, so it lives here and the layout overlays it on the header's action area.
 */
@Component({
  selector: 'app-user-menu',
  imports: [AvatarComponent],
  template: `
    <button
      type="button"
      class="trigger"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
      aria-controls="user-menu"
      (click)="toggle()"
    >
      <dsb-avatar [name]="name()" size="sm" />
      <span class="name">{{ name() }}</span>
      <svg class="chevron" [class.chevron--open]="open()" viewBox="0 0 10 6" fill="none" aria-hidden="true">
        <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    @if (open()) {
      <ul id="user-menu" class="menu" role="menu" aria-label="Account">
        <li role="none">
          <button type="button" role="menuitem" class="item" (click)="choose('profile')">My Profile</button>
        </li>
        <li role="none">
          <button type="button" role="menuitem" class="item item--danger" (click)="choose('signOut')">Sign Out</button>
        </li>
      </ul>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: inline-flex;
    }

    .trigger {
      display: inline-flex;
      align-items: center;
      gap: var(--ds-decisions-space-sm);
      padding: var(--ds-decisions-space-2xs) var(--ds-decisions-space-sm) var(--ds-decisions-space-2xs) var(--ds-decisions-space-2xs);
      border: none;
      border-radius: var(--ds-decisions-border-radius-lg);
      background: transparent;
      font: inherit;
      color: var(--ds-decisions-color-text-primary);
      cursor: pointer;
      transition: background var(--ds-decisions-motion-duration-base) var(--ds-decisions-motion-easing-standard);
    }

    .trigger:hover {
      background: var(--ds-decisions-color-surface-hover);
    }

    .trigger:focus-visible {
      outline: none;
      box-shadow: var(--ds-decisions-shadow-focus);
    }

    .name {
      font-size: var(--ds-decisions-font-size-sm);
      font-weight: var(--ds-decisions-font-weight-medium);
      white-space: nowrap;
    }

    /* Narrow viewports: the avatar alone identifies the account; the name stays for screen readers. */
    @media (max-width: 640px) {
      .name {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
      }
    }

    .chevron {
      width: var(--ds-decisions-size-glyph-sm);
      height: var(--ds-decisions-size-glyph-3xs);
      color: var(--ds-decisions-color-text-subtle);
      transition: transform var(--ds-decisions-motion-duration-fast) var(--ds-decisions-motion-easing-standard);
    }

    .chevron--open {
      transform: rotate(180deg);
    }

    /* Anchored to the trigger's right edge so it always opens leftward, inside the viewport. */
    .menu {
      position: absolute;
      top: calc(100% + var(--ds-decisions-space-2xs));
      right: 0;
      z-index: var(--ds-decisions-z-index-dropdown);
      min-width: var(--ds-decisions-layout-width-2xs);
      max-width: calc(100vw - 2 * var(--ds-decisions-space-xl));
      margin: 0;
      padding: var(--ds-decisions-space-2xs);
      list-style: none;
      background: var(--ds-decisions-color-surface-base);
      border: var(--ds-decisions-border-width-control) solid var(--ds-decisions-color-border-control);
      border-radius: var(--ds-decisions-border-radius-lg);
      box-shadow: var(--ds-decisions-shadow-dropdown);
    }

    .item {
      display: block;
      width: 100%;
      padding: var(--ds-decisions-space-sm) var(--ds-decisions-space-md);
      border: none;
      border-radius: var(--ds-decisions-border-radius-sm);
      background: transparent;
      font: inherit;
      font-size: var(--ds-decisions-font-size-md);
      color: var(--ds-decisions-color-text-primary);
      text-align: left;
      cursor: pointer;
      transition: background var(--ds-decisions-motion-duration-fast) var(--ds-decisions-motion-easing-standard);
    }

    .item:hover,
    .item:focus-visible {
      outline: none;
      background: var(--ds-decisions-color-surface-hover);
    }

    .item--danger {
      color: var(--ds-decisions-color-action-danger-text);
    }
  `,
})
export class UserMenuComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly name = input.required<string>();
  readonly profile = output<void>();
  readonly signOut = output<void>();

  readonly open = signal(false);

  toggle(): void {
    this.open.update((v) => !v);
  }

  choose(action: 'profile' | 'signOut'): void {
    this.open.set(false);
    if (action === 'profile') {
      this.profile.emit();
    } else {
      this.signOut.emit();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }
}
