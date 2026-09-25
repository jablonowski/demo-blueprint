import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private profile = viewChild.required<ElementRef<HTMLElement>>('profile');

  readonly userName = 'Admin User';
  readonly year = new Date().getFullYear();
  menuOpen = signal(false);

  readonly footerColumns = [
    { title: 'Product', links: ['Dashboard', 'Team', 'Integrations', 'Changelog'] },
    { title: 'Resources', links: ['Documentation', 'API Reference', 'Status', 'Support'] },
    { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
  ];
  readonly legalLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Settings'];

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
    this.router.navigateByUrl('/login');
  }
}
