import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FooterColumn, FooterComponent, FooterLink, HeaderComponent, NavItem } from '@jablonowski/dsb-components';
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

  readonly brandName = 'Blueprint';

  /**
   * The design system's header has no collapsed state, so on very narrow screens the brand
   * text gives way (the logo mark stays) to leave room for the nav and the profile control.
   */
  private readonly narrow = signal(false);
  readonly headerBrand = computed(() => (this.narrow() ? '' : this.brandName));
  readonly userName = 'Admin User';

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly navItems = computed<NavItem[]>(() => [
    { label: 'Dashboard', href: '/dashboard', active: this.url().startsWith('/dashboard') },
    { label: 'Users', href: '/users', active: this.url().startsWith('/users') },
  ]);

  readonly footerColumns: FooterColumn[] = [
    {
      heading: 'Product',
      links: [
        { label: 'Overview', href: '#' },
        { label: 'Metrics', href: '#' },
        { label: 'Logs', href: '#' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Contact', href: '#' },
      ],
    },
    {
      heading: 'Resources',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'Status', href: '#' },
        { label: 'Support', href: '#' },
      ],
    },
  ];

  readonly legalLinks: FooterLink[] = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ];

  constructor() {
    const query = window.matchMedia('(max-width: 520px)');
    const update = () => this.narrow.set(query.matches);
    update();
    query.addEventListener('change', update);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', update));
  }

  readonly copyright = `© ${new Date().getFullYear()} Blueprint. All rights reserved.`;

  /**
   * The design system's header and footer render plain anchors. Route in-app links through
   * the router instead of a full page load, and keep placeholder `#` links inert.
   */
  interceptLinks(event: MouseEvent): void {
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
