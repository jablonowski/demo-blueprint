import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { AvatarComponent } from '@jablonowski/dsb-components';

@Component({
  selector: 'app-user-menu',
  imports: [AvatarComponent],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.css',
})
export class UserMenuComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly userName = input.required<string>();
  readonly profile = output<void>();
  readonly signOut = output<void>();

  readonly open = signal(false);

  toggle(): void {
    this.open.update(open => !open);
  }

  select(action: 'profile' | 'signOut'): void {
    this.open.set(false);
    if (action === 'profile') {
      this.profile.emit();
    } else {
      this.signOut.emit();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }
}
