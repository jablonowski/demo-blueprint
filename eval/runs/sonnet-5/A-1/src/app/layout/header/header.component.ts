import { Component, ElementRef, EventEmitter, HostListener, Output, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AvatarComponent } from '../../shared/ui/avatar/avatar.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @ViewChild('profile') private profileRef?: ElementRef<HTMLElement>;

  @Output() signOut = new EventEmitter<void>();

  menuOpen = false;

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  onSignOut(): void {
    this.menuOpen = false;
    this.signOut.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen && !this.profileRef?.nativeElement.contains(event.target as Node)) {
      this.menuOpen = false;
    }
  }
}
