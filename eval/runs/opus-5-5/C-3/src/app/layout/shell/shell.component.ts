import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import {
  AvatarComponent,
  FooterColumn,
  FooterComponent,
  FooterLink,
  HeaderComponent,
  NavItem,
} from '@jablonowski/dsb-components';
import { filter, map } from 'rxjs';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, AvatarComponent, FooterComponent, HeaderComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly brandName = 'Blueprint';
  readonly userName = 'Admin User';
  readonly menuOpen = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  navItems(): NavItem[] {
    const url = this.url();
    return [
      { label: 'Dashboard', href: '/dashboard', active: url.startsWith('/dashboard') },
      { label: 'Team Members', href: '/users', active: url.startsWith('/users') },
    ];
  }

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
        { label: 'Status', href: '#' },
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

  /**
   * dsb-header and dsb-footer render plain anchors. Route in-app links through the
   * router so navigation does not reload the page; leave placeholder links inert.
   */
  onLinkClick(event: MouseEvent): void {
    const anchor = (event.target as HTMLElement).closest('a');
    const href = anchor?.getAttribute('href');
    if (!href || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    if (href.startsWith('/')) {
      event.preventDefault();
      this.router.navigateByUrl(href);
    } else if (href === '#') {
      event.preventDefault();
    }
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  openProfile(): void {
    this.menuOpen.set(false);
  }

  signOut(): void {
    this.menuOpen.set(false);
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) {
      return;
    }
    const menu = (this.host.nativeElement as HTMLElement).querySelector('.profile');
    if (menu && !menu.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuOpen.set(false);
  }
}
