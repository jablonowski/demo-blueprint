import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { AvatarComponent } from '@jablonowski/dsb-components';

/**
 * Header profile control. The library header has no projection slot, so this is
 * built locally and positioned by the layout. The menu is anchored to the
 * trigger's right edge so it always opens leftward, inside the viewport.
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
      (click)="open.set(!open())"
    >
      <dsb-avatar [name]="userName()" size="sm" />
      <span class="name">{{ userName() }}</span>
      <svg class="chevron" [class.chevron--open]="open()" viewBox="0 0 10 6" fill="none" aria-hidden="true">
        <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    @if (open()) {
      <ul class="menu" role="menu">
        <li role="none">
          <button type="button" role="menuitem" class="item" (click)="open.set(false)">My Profile</button>
        </li>
        <li role="none" class="separator" aria-hidden="true"></li>
        <li role="none">
          <button type="button" role="menuitem" class="item item--danger" (click)="onSignOut()">Sign Out</button>
        </li>
      </ul>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: inline-block;
    }
    .trigger {
      display: flex;
      align-items: center;
      gap: var(--ds-decisions-space-sm);
      height: var(--ds-decisions-size-control-md);
      padding: 0 var(--ds-decisions-space-sm) 0 var(--ds-decisions-space-2xs);
      border: none;
      border-radius: var(--ds-decisions-border-radius-lg);
      background: transparent;
      font: inherit;
      font-size: var(--ds-decisions-font-size-md);
      font-weight: var(--ds-decisions-font-weight-medium);
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
      white-space: nowrap;
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
    .menu {
      position: absolute;
      top: calc(100% + var(--ds-decisions-space-2xs));
      right: 0;
      z-index: var(--ds-decisions-z-index-dropdown);
      min-width: var(--ds-decisions-layout-width-2xs);
      margin: 0;
      padding: var(--ds-decisions-space-2xs);
      list-style: none;
      background: var(--ds-decisions-color-surface-base);
      border: var(--ds-decisions-border-width-hairline) solid var(--ds-decisions-color-border-subtle);
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
    }
    .item:hover,
    .item:focus-visible {
      outline: none;
      background: var(--ds-decisions-color-surface-hover);
    }
    .item--danger {
      color: var(--ds-decisions-color-feedback-error-text);
    }
    .separator {
      height: var(--ds-decisions-border-width-hairline);
      margin: var(--ds-decisions-space-2xs) 0;
      background: var(--ds-decisions-color-border-hairline);
    }
  `,
})
export class UserMenuComponent {
  readonly userName = input('Admin User');
  readonly signOut = output<void>();
  readonly open = signal(false);

  private readonly host = inject(ElementRef<HTMLElement>);

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

  onSignOut(): void {
    this.open.set(false);
    this.signOut.emit();
  }
}
