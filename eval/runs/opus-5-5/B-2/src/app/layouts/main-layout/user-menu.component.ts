import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { AvatarComponent } from '@jablonowski/dsb-components';

/**
 * Profile control for the top-right corner of the header. The design system's
 * header has no slot for it, so it lives here and is laid over the header.
 */
@Component({
  selector: 'app-user-menu',
  imports: [AvatarComponent],
  template: `
    <button
      type="button"
      class="user-trigger"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
      (click)="toggle()"
    >
      <dsb-avatar size="sm" [name]="name()" />
      <span class="user-name">{{ name() }}</span>
      <svg class="user-chevron" [class.user-chevron--open]="open()" viewBox="0 0 10 6" fill="none" aria-hidden="true">
        <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    @if (open()) {
      <ul class="user-menu" role="menu">
        <li role="none">
          <button type="button" role="menuitem" class="user-menu-item" (click)="close()">My Profile</button>
        </li>
        <li role="none">
          <button type="button" role="menuitem" class="user-menu-item" (click)="signOut()">Sign Out</button>
        </li>
      </ul>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: inline-flex;
    }

    .user-trigger {
      display: inline-flex;
      align-items: center;
      gap: var(--ds-decisions-space-sm);
      padding: var(--ds-decisions-space-2xs) var(--ds-decisions-space-sm) var(--ds-decisions-space-2xs) var(--ds-decisions-space-2xs);
      font: inherit;
      font-size: var(--ds-decisions-font-size-md);
      font-weight: var(--ds-decisions-font-weight-medium);
      color: var(--ds-decisions-color-text-primary);
      background: transparent;
      border: none;
      border-radius: var(--ds-decisions-border-radius-lg);
      cursor: pointer;
      transition: background var(--ds-decisions-motion-duration-base) var(--ds-decisions-motion-easing-standard);
    }

    .user-trigger:hover {
      background: var(--ds-decisions-color-surface-hover);
    }

    .user-trigger:focus-visible {
      outline: none;
      box-shadow: var(--ds-decisions-shadow-focus);
    }

    .user-chevron {
      width: var(--ds-decisions-size-glyph-sm);
      height: var(--ds-decisions-size-glyph-3xs);
      color: var(--ds-decisions-color-text-subtle);
      transition: transform var(--ds-decisions-motion-duration-fast) var(--ds-decisions-motion-easing-standard);
    }

    .user-chevron--open {
      transform: rotate(180deg);
    }

    /* Anchored to the trigger's right edge so it grows leftward, into the viewport. */
    .user-menu {
      position: absolute;
      top: calc(100% + var(--ds-decisions-space-2xs));
      right: 0;
      z-index: var(--ds-decisions-z-index-dropdown);
      min-width: var(--ds-decisions-layout-width-2xs);
      max-width: calc(100vw - var(--ds-decisions-space-3xl));
      margin: 0;
      padding: var(--ds-decisions-space-2xs);
      list-style: none;
      background: var(--ds-decisions-color-surface-base);
      border: var(--ds-decisions-border-width-control) solid var(--ds-decisions-color-border-control);
      border-radius: var(--ds-decisions-border-radius-lg);
      box-shadow: var(--ds-decisions-shadow-dropdown);
    }

    .user-menu-item {
      display: block;
      width: 100%;
      padding: var(--ds-decisions-space-sm) var(--ds-decisions-space-md);
      font: inherit;
      font-size: var(--ds-decisions-font-size-md);
      text-align: left;
      color: var(--ds-decisions-color-text-primary);
      background: transparent;
      border: none;
      border-radius: var(--ds-decisions-border-radius-sm);
      cursor: pointer;
    }

    .user-menu-item:hover,
    .user-menu-item:focus-visible {
      outline: none;
      background: var(--ds-decisions-color-surface-hover);
    }
  `,
})
export class UserMenuComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly name = input.required<string>();
  readonly signedOut = output<void>();
  readonly open = signal(false);

  toggle(): void {
    this.open.update((open) => !open);
  }

  close(): void {
    this.open.set(false);
  }

  signOut(): void {
    this.close();
    this.signedOut.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}
