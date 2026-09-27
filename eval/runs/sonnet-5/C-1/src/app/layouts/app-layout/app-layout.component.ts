import { NgIf } from '@angular/common';
import { Component, ElementRef, HostListener } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AvatarComponent, FooterComponent, HeaderComponent, NavItem } from '@jablonowski/dsb-components';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [NgIf, RouterOutlet, HeaderComponent, FooterComponent, AvatarComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.css',
})
export class AppLayoutComponent {
  menuOpen = false;

  navItems: NavItem[] = [];

  footerColumns = [
    {
      heading: 'Product',
      links: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Team Members', href: '/users' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Contact', href: '#' },
      ],
    },
  ];

  footerLegalLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
    private elRef: ElementRef<HTMLElement>
  ) {
    this.updateNavItems();
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => this.updateNavItems());
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  onMyProfile(): void {
    this.menuOpen = false;
  }

  onSignOut(): void {
    this.menuOpen = false;
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen) {
      return;
    }
    const target = event.target as HTMLElement;
    if (!this.elRef.nativeElement.querySelector('.profile-wrap')?.contains(target)) {
      this.menuOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuOpen = false;
  }

  @HostListener('click', ['$event'])
  onAnchorClick(event: MouseEvent): void {
    const anchor = (event.target as HTMLElement).closest('a') as HTMLAnchorElement | null;
    if (!anchor) {
      return;
    }
    const href = anchor.getAttribute('href');
    if (!href) {
      return;
    }
    event.preventDefault();
    if (href.startsWith('/')) {
      this.router.navigateByUrl(href);
    }
  }

  private updateNavItems(): void {
    const url = this.router.url;
    this.navItems = [
      { label: 'Dashboard', href: '/dashboard', active: url.startsWith('/dashboard') },
      { label: 'Team Members', href: '/users', active: url.startsWith('/users') },
    ];
  }
}
