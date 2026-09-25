import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { AvatarComponent } from '@jablonowski/dsb-components';

/**
 * Profile control for the header's top-right corner. The menu is anchored to
 * the trigger's right edge, so it grows leftward and stays inside the viewport.
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
      <ul id="user-menu" class="menu" role="menu">
        <li role="none">
          <button type="button" role="menuitem" class="item" (click)="close()">My Profile</button>
        </li>
        <li role="none">
          <button type="button" role="menuitem" class="item" (click)="onSignOut()">Sign Out</button>
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
      background: var(--ds-decisions-color-action-ghost-background);
      color: var(--ds-decisions-color-action-ghost-text-hover);
      font: inherit;
      font-size: var(--ds-decisions-font-size-md);
      font-weight: var(--ds-decisions-font-weight-medium);
      border-radius: var(--ds-decisions-border-radius-lg);
      cursor: pointer;
      transition: background var(--ds-decisions-motion-duration-base) var(--ds-decisions-motion-easing-standard);
    }

    .trigger:hover {
      background: var(--ds-decisions-color-action-ghost-background-hover);
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
      transition: transform var(--ds-decisions-motion-duration-slow) var(--ds-decisions-motion-easing-standard);
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
      padding: var(--ds-decisions-space-sm) var(--ds-decisions-space-lg);
      border: none;
      background: transparent;
      color: var(--ds-decisions-color-text-primary);
      font: inherit;
      font-size: var(--ds-decisions-font-size-md);
      text-align: left;
      border-radius: var(--ds-decisions-border-radius-md);
      cursor: pointer;
      transition: background var(--ds-decisions-motion-duration-fast) var(--ds-decisions-motion-easing-standard);
    }

    .item:hover {
      background: var(--ds-decisions-color-surface-hover);
    }

    .item:focus-visible {
      outline: none;
      box-shadow: var(--ds-decisions-shadow-focus);
    }
  `,
})
export class UserMenuComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly name = input.required<string>();
  readonly signOut = output<void>();
  readonly open = signal(false);

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  onSignOut(): void {
    this.close();
    this.signOut.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}
