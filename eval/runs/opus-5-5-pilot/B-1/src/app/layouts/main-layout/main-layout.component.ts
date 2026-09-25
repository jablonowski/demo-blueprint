import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { FooterColumn, FooterComponent, FooterLink, HeaderComponent, NavItem } from '@jablonowski/dsb-components';

import { AuthService } from '../../core/auth.service';
import { UserMenuComponent } from './user-menu.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, UserMenuComponent],
  template: `
    <div class="shell">
      <div class="header-bar" (click)="interceptLinks($event)">
        <dsb-header [brandName]="brand" logoHref="/dashboard" logoAlt="Blueprint home" [navItems]="navItems()" />
        <app-user-menu class="profile" userName="Admin User" (signOut)="signOut()" />
      </div>

      <main class="content">
        <router-outlet />
      </main>

      <div (click)="interceptLinks($event)">
        <dsb-footer
          [brandName]="brand"
          logoHref="/dashboard"
          [columns]="footerColumns"
          [copyright]="copyright"
          [legalLinks]="legalLinks"
        />
      </div>
    </div>
  `,
  styles: `
    .shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header-bar {
      position: relative;
      z-index: var(--ds-decisions-z-index-dropdown);
    }
    .profile {
      position: absolute;
      top: 50%;
      right: var(--ds-decisions-space-3xl);
      transform: translateY(-50%);
    }
    .content {
      flex: 1;
      width: 100%;
      max-width: var(--ds-decisions-layout-width-3xl);
      margin: 0 auto;
      padding: var(--ds-decisions-space-4xl) var(--ds-decisions-space-3xl);
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--ds-decisions-space-3xl);
      align-content: start;
    }
  `,
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly brand = 'Blueprint';
  readonly copyright = `© ${new Date().getFullYear()} Blueprint Inc. All rights reserved.`;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly navItems = computed<NavItem[]>(() => [
    { label: 'Dashboard', href: '/dashboard', active: this.url().startsWith('/dashboard') },
    { label: 'Team', href: '/users', active: this.url().startsWith('/users') },
  ]);

  readonly footerColumns: FooterColumn[] = [
    {
      heading: 'Product',
      links: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Team', href: '/users' },
        { label: 'Changelog', href: '#' },
      ],
    },
    {
      heading: 'Resources',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'API Reference', href: '#' },
        { label: 'Status', href: '#' },
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
  ];

  readonly legalLinks: FooterLink[] = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookies', href: '#' },
  ];

  /**
   * The library header and footer render plain anchors. Route internal links
   * through the router so navigation keeps the SPA (and the in-memory data)
   * alive, and swallow placeholder '#' links.
   */
  interceptLinks(event: MouseEvent): void {
    const anchor = (event.target as HTMLElement).closest('a');
    const href = anchor?.getAttribute('href');
    if (!href || event.ctrlKey || event.metaKey || event.shiftKey) {
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
    this.router.navigate(['/login']);
  }
}
