import { Component, ElementRef, EventEmitter, HostListener, Output, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AvatarComponent } from '../../shared/avatar/avatar.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Output() signOut = new EventEmitter<void>();
  @ViewChild('profileWidget') profileWidget?: ElementRef<HTMLElement>;

  menuOpen = false;

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  onSignOutClick(): void {
    this.menuOpen = false;
    this.signOut.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const widget = this.profileWidget?.nativeElement;
    if (this.menuOpen && widget && !widget.contains(event.target as Node)) {
      this.menuOpen = false;
    }
  }
}
