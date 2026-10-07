import { Component, DestroyRef, ElementRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import {
  AvatarComponent,
  FooterColumn,
  FooterComponent,
  FooterLink,
  HeaderComponent,
  NavItem,
} from '@jablonowski/dsb-components';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, AvatarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly userName = 'Admin User';
  readonly menuOpen = signal(false);
  readonly navItems = signal<NavItem[]>(this.buildNav(this.router.url));

  readonly footerColumns: FooterColumn[] = [
    {
      heading: 'Product',
      links: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Team Members', href: '/users' },
      ],
    },
    {
      heading: 'Resources',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'Changelog', href: '#' },
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

  readonly legalLinks: FooterLink[] = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ];

  readonly copyright = `© ${new Date().getFullYear()} Blueprint. All rights reserved.`;

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((e) => this.navItems.set(this.buildNav(e.urlAfterRedirects)));
  }

  private buildNav(url: string): NavItem[] {
    return [
      { label: 'Dashboard', href: '/dashboard', active: url.startsWith('/dashboard') },
      { label: 'Users', href: '/users', active: url.startsWith('/users') },
    ];
  }

  /**
   * dsb-header and dsb-footer render plain anchors. Internal links are routed through the
   * Angular router so the SPA (and the in-memory database) is not reloaded on navigation.
   */
  onShellClick(event: MouseEvent): void {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const anchor = (event.target as HTMLElement).closest('a');
    const href = anchor?.getAttribute('href');
    if (!anchor || !href) return;
    if (href === '#') {
      event.preventDefault();
      return;
    }
    if (href.startsWith('/')) {
      event.preventDefault();
      this.router.navigateByUrl(href === '/' ? '/dashboard' : href);
    }
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) return;
    const menu = (this.host.nativeElement as HTMLElement).querySelector('.user-menu');
    if (menu && !menu.contains(event.target as Node)) this.closeMenu();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }

  signOut(): void {
    this.closeMenu();
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
