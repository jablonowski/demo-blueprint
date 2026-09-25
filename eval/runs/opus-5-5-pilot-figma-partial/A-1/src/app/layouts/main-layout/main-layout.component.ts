import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { AvatarComponent } from '../../shared/avatar.component';

interface FooterColumn {
  title: string;
  links: string[];
}

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly profile = viewChild.required<ElementRef<HTMLElement>>('profile');

  protected readonly userName = 'Admin User';
  protected readonly menuOpen = signal(false);
  protected readonly year = new Date().getFullYear();

  protected readonly navLinks = [
    { label: 'Overview', path: '/dashboard' },
    { label: 'Team', path: '/users' },
  ];

  protected readonly footerColumns: FooterColumn[] = [
    { title: 'Product', links: ['Overview', 'Metrics', 'Changelog'] },
    { title: 'Resources', links: ['Documentation', 'API Reference', 'Status'] },
    { title: 'Company', links: ['About', 'Careers', 'Contact'] },
  ];

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected signOut(): void {
    this.menuOpen.set(false);
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen() && !this.profile().nativeElement.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.menuOpen.set(false);
  }
}
