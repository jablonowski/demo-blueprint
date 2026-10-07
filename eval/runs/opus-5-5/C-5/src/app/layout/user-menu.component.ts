import { Component, ElementRef, HostListener, inject, input, output } from '@angular/core';
import { AvatarComponent } from '@jablonowski/dsb-components';

/**
 * Header profile control. dsb-header exposes no slot for it, so the layout
 * overlays it on the header's right edge. The menu is anchored to the right
 * edge of the trigger and grows leftward, so it never leaves the viewport.
 */
@Component({
  selector: 'app-user-menu',
  imports: [AvatarComponent],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.css',
})
export class UserMenuComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly name = input.required<string>();
  readonly profile = output<void>();
  readonly signOut = output<void>();

  open = false;

  toggle(): void {
    this.open = !this.open;
  }

  choose(action: 'profile' | 'signOut'): void {
    this.open = false;
    if (action === 'profile') {
      this.profile.emit();
    } else {
      this.signOut.emit();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.open && !this.host.nativeElement.contains(event.target as Node)) {
      this.open = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open = false;
  }
}
