import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AvatarComponent,
  FooterColumn,
  FooterComponent,
  HeaderComponent,
  NavItem,
} from '@jablonowski/dsb-components';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, AvatarComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css',
})
export class AuthLayoutComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly elRef = inject(ElementRef<HTMLElement>);

  protected readonly menuOpen = signal(false);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly navItems = () =>
    (
      [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Team Members', href: '/users' },
      ] satisfies NavItem[]
    ).map((item) => ({ ...item, active: this.currentUrl().startsWith(item.href) }));

  protected readonly footerColumns: FooterColumn[] = [
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

  protected readonly legalLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ];

  protected readonly copyright = `© ${new Date().getFullYear()} Blueprint. All rights reserved.`;

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected onProfile(): void {
    this.menuOpen.set(false);
  }

  protected onSignOut(): void {
    this.menuOpen.set(false);
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) {
      return;
    }
    if (!this.elRef.nativeElement.querySelector('.user-menu')?.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  protected onHeaderNavClick(event: MouseEvent): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const anchor = (event.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
    if (!anchor) {
      return;
    }
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin) {
      return;
    }
    event.preventDefault();
    this.router.navigateByUrl(url.pathname + url.search + url.hash);
  }
}
