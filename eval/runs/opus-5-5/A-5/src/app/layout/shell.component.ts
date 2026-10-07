import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../core/auth.service';
import { AvatarComponent } from '../shared/avatar.component';

interface FooterColumn {
  heading: string;
  links: string[];
}

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent],
  host: { '(document:click)': 'onDocumentClick($event)', '(document:keydown.escape)': 'menuOpen.set(false)' },
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly profile = viewChild.required<ElementRef<HTMLElement>>('profile');

  readonly userName = 'Admin User';
  readonly menuOpen = signal(false);
  readonly year = new Date().getFullYear();

  readonly nav = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Team Members', path: '/users' },
  ];

  readonly footerColumns: FooterColumn[] = [
    { heading: 'Product', links: ['Overview', 'Metrics', 'Logs'] },
    { heading: 'Company', links: ['About', 'Careers', 'Contact'] },
    { heading: 'Resources', links: ['Documentation', 'Status', 'Support'] },
  ];

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen() && !this.profile().nativeElement.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  signOut(): void {
    this.menuOpen.set(false);
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
