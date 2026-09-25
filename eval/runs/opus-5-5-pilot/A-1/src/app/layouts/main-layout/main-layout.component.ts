import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';

interface FooterColumn {
  title: string;
  links: string[];
}

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly menuRoot = viewChild.required<ElementRef<HTMLElement>>('menuRoot');

  protected readonly userName = this.auth.userName;
  protected readonly menuOpen = signal(false);
  protected readonly year = new Date().getFullYear();

  protected readonly nav = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Users', path: '/users' }
  ];

  protected readonly footerColumns: FooterColumn[] = [
    { title: 'Product', links: ['Overview', 'Features', 'Pricing', 'Changelog'] },
    { title: 'Resources', links: ['Documentation', 'Guides', 'API Reference', 'Status'] },
    { title: 'Company', links: ['About', 'Careers', 'Blog', 'Contact'] }
  ];

  protected readonly legalLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Settings'];

  protected toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen() && !this.menuRoot().nativeElement.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.menuOpen.set(false);
  }

  protected signOut(): void {
    this.menuOpen.set(false);
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
