import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../core/auth.service';
import { AvatarComponent } from '../shared/avatar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly profile = viewChild.required<ElementRef<HTMLElement>>('profile');

  readonly userName = 'Admin User';
  readonly year = new Date().getFullYear();
  readonly menuOpen = signal(false);

  readonly footerColumns = [
    { title: 'Product', links: ['Overview', 'Metrics', 'Logs'] },
    { title: 'Company', links: ['About', 'Careers', 'Contact'] },
    { title: 'Resources', links: ['Documentation', 'Status', 'Support'] },
  ];

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen() && !this.profile().nativeElement.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuOpen.set(false);
  }

  signOut(): void {
    this.menuOpen.set(false);
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
