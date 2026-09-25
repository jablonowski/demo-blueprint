import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { LogoComponent } from '../logo.component';

interface FooterColumn {
  title: string;
  links: string[];
}

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent, LogoComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly userName = 'Admin User';
  protected readonly menuOpen = signal(false);
  protected readonly year = new Date().getFullYear();

  protected readonly navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Users', path: '/users' },
  ];

  protected readonly footerColumns: FooterColumn[] = [
    { title: 'Product', links: ['Features', 'Pricing', 'Changelog'] },
    { title: 'Company', links: ['About', 'Careers', 'Blog'] },
    { title: 'Resources', links: ['Documentation', 'Support', 'Status'] },
  ];

  protected readonly legalLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Settings'];

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  signOut(): void {
    this.menuOpen.set(false);
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const menu = this.host.nativeElement.querySelector('.profile');
    if (this.menuOpen() && menu && !menu.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuOpen.set(false);
  }
}
