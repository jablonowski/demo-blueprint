import { Component, ElementRef, HostListener } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import {
  AvatarComponent,
  FooterColumn,
  FooterComponent,
  HeaderComponent,
  ListComponent,
  ListItemComponent,
  NavItem
} from '@jablonowski/dsb-components';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, AvatarComponent, ListComponent, ListItemComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent {
  menuOpen = false;

  navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Team Members', href: '/users' }
  ];

  footerColumns: FooterColumn[] = [
    {
      heading: 'Product',
      links: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Team Members', href: '/users' }
      ]
    },
    {
      heading: 'Resources',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'Support', href: '#' }
      ]
    }
  ];

  legalLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' }
  ];

  constructor(
    private elRef: ElementRef<HTMLElement>,
    private auth: AuthService,
    private router: Router
  ) {}

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  signOut(): void {
    this.auth.logout();
    this.closeMenu();
    this.router.navigateByUrl('/login');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen) return;
    const profileControl = this.elRef.nativeElement.querySelector('.profile-control');
    if (profileControl && !profileControl.contains(event.target as Node)) {
      this.closeMenu();
    }
  }
}
