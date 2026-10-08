import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { AvatarComponent, ListComponent, ListItemComponent } from '@jablonowski/dsb-components';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [AvatarComponent, ListComponent, ListItemComponent],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.css',
})
export class UserMenuComponent {
  @Input() userName = 'Admin User';
  @Output() signOut = new EventEmitter<void>();

  open = false;

  constructor(private elRef: ElementRef<HTMLElement>) {}

  toggle(): void {
    this.open = !this.open;
  }

  onProfile(): void {
    this.open = false;
  }

  onSignOut(): void {
    this.open = false;
    this.signOut.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target as Node)) {
      this.open = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open = false;
  }
}
