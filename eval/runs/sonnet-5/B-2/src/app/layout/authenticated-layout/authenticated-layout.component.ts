import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { HeaderComponent, FooterComponent, NavItem } from '@jablonowski/dsb-components';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, UserMenuComponent],
  templateUrl: './authenticated-layout.component.html',
  styleUrl: './authenticated-layout.component.css',
})
export class AuthenticatedLayoutComponent implements OnInit, OnDestroy {
  navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', active: false },
    { label: 'Team Members', href: '/users', active: false },
  ];

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
        { label: 'Careers', href: '#' },
      ],
    },
    {
      heading: 'Resources',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'Support', href: '#' },
      ],
    },
  ];

  legalLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ];

  private sub?: Subscription;

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.updateActiveNav(this.router.url);
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.updateActiveNav(e.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onSignOut(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  private updateActiveNav(url: string): void {
    this.navItems = this.navItems.map((item) => ({
      ...item,
      active: url.startsWith(item.href),
    }));
  }
}
