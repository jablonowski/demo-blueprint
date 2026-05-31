import { Component, Output, EventEmitter, HostListener, ElementRef, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { AvatarComponent } from '@jablonowski/dsb-components';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-profile-menu',
  standalone: true,
  imports: [NgIf, AvatarComponent],
  templateUrl: './user-profile-menu.component.html',
  styleUrls: ['./user-profile-menu.component.css']
})
export class UserProfileMenuComponent {
  @Output() signOut = new EventEmitter<void>();

  isOpen = false;
  private el = inject(ElementRef);
  private router = inject(Router);

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (!this.el.nativeElement.contains(e.target)) this.isOpen = false;
  }

  toggleMenu(e: MouseEvent) { e.stopPropagation(); this.isOpen = !this.isOpen; }
  onMyProfile() { this.isOpen = false; }
  onSignOut() { this.isOpen = false; this.signOut.emit(); }
}
