import { Component, HostListener, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import {
  FooterColumn,
  FooterComponent,
  FooterLink,
  HeaderComponent,
  NavItem,
} from '@jablonowski/dsb-components';
import { filter, map } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { UserMenuComponent } from './user-menu.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, UserMenuComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly brand = 'Blueprint';
  readonly userName = 'Admin User';

  readonly navItems = computed<NavItem[]>(() => [
    { label: 'Dashboard', href: '/dashboard', active: this.url().startsWith('/dashboard') },
    { label: 'Team Members', href: '/users', active: this.url().startsWith('/users') },
  ]);

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
   * The header and footer render plain anchors. Route in-app links through the
   * router instead of reloading the page, and keep placeholder links inert.
   */
  @HostListener('click', ['$event'])
  onLinkClick(event: MouseEvent): void {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
      return;
    }
    const anchor = (event.target as HTMLElement).closest('a');
    const href = anchor?.getAttribute('href');
    if (!href) {
      return;
    }
    if (href === '#') {
      event.preventDefault();
    } else if (href.startsWith('/')) {
      event.preventDefault();
      this.router.navigateByUrl(href);
    }
  }

  signOut(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
