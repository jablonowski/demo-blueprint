import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { FooterComponent, HeaderComponent, NavItem } from '@jablonowski/dsb-components';
import { AuthService } from '../../core/auth.service';
import { ProfileMenuComponent } from '../profile-menu/profile-menu.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ProfileMenuComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent implements OnInit, OnDestroy {
  navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Team Members', href: '/users' },
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

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.updateActiveNav(this.router.url);
    this.sub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.updateActiveNav(event.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private updateActiveNav(url: string): void {
    this.navItems = this.navItems.map((item) => ({
      ...item,
      active: url.startsWith(item.href),
    }));
  }

  signOut(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
