import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { AvatarComponent } from '../../shared/avatar.component';

interface FooterColumn {
  heading: string;
  links: string[];
}

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly profile = viewChild.required<ElementRef<HTMLElement>>('profile');

  protected readonly userName = this.auth.displayName;
  protected readonly menuOpen = signal(false);
  protected readonly year = new Date().getFullYear();

  protected readonly navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Team Members', path: '/users' },
  ];

  protected readonly footerColumns: FooterColumn[] = [
    { heading: 'Product', links: ['Overview', 'Metrics', 'Logs'] },
    { heading: 'Company', links: ['About', 'Careers', 'Contact'] },
    { heading: 'Resources', links: ['Documentation', 'Status', 'Support'] },
  ];

  protected readonly legalLinks = ['Privacy Policy', 'Terms of Service'];

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected signOut(): void {
    this.closeMenu();
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen() && !this.profile().nativeElement.contains(event.target as Node)) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeMenu();
  }
}
