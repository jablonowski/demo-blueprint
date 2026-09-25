import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AvatarComponent, FooterColumn, FooterComponent, FooterLink, HeaderComponent, NavItem } from '@jablonowski/dsb-components';
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

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly navItems = computed<NavItem[]>(() => [
    { label: 'Dashboard', href: '/dashboard', active: this.url().startsWith('/dashboard') },
    { label: 'Team Members', href: '/users', active: this.url().startsWith('/users') },
  ]);

  readonly footerColumns: FooterColumn[] = [
    { heading: 'Product', links: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Team Members', href: '/users' }] },
    { heading: 'Resources', links: [{ label: 'Documentation', href: '#' }, { label: 'Support', href: '#' }] },
    { heading: 'Company', links: [{ label: 'About', href: '#' }, { label: 'Contact', href: '#' }] },
  ];

  readonly legalLinks: FooterLink[] = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ];

  readonly copyright = '© 2026 Blueprint. All rights reserved.';

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  openProfile(): void {
    this.menuOpen.set(false);
  }

  signOut(): void {
    this.menuOpen.set(false);
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  /**
   * dsb-header and dsb-footer render plain anchors. Route in-app links through the
   * router so navigation does not reload the page, and keep placeholder links inert.
   */
  @HostListener('click', ['$event'])
  onLinkClick(event: MouseEvent): void {
    const anchor = (event.target as HTMLElement).closest('a');
    if (!anchor || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const href = anchor.getAttribute('href');
    if (!href || !href.startsWith('/') && href !== '#') return;
    event.preventDefault();
    if (href !== '#') this.router.navigateByUrl(href === '/' ? '/dashboard' : href);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) return;
    const profile = (this.host.nativeElement as HTMLElement).querySelector('.profile');
    if (profile && !profile.contains(event.target as Node)) this.menuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuOpen.set(false);
  }
}
