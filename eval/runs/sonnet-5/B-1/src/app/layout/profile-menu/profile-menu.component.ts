import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';
import { AvatarComponent } from '@jablonowski/dsb-components';

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './profile-menu.component.html',
  styleUrl: './profile-menu.component.css',
})
export class ProfileMenuComponent {
  @Output() signOut = new EventEmitter<void>();

  open = false;
  readonly userName = 'Admin User';

  constructor(private elRef: ElementRef<HTMLElement>) {}

  toggle(): void {
    this.open = !this.open;
  }

  close(): void {
    this.open = false;
  }

  onSignOut(): void {
    this.close();
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
