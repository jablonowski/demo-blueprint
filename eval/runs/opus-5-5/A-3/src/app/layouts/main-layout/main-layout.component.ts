import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { LogoComponent } from './logo.component';
import { UserMenuComponent } from './user-menu.component';

interface FooterColumn {
  heading: string;
  links: string[];
}

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent, UserMenuComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly userName = this.auth.displayName;
  protected readonly year = new Date().getFullYear();

  protected readonly nav = [
    { label: 'Overview', path: '/dashboard' },
    { label: 'Team Members', path: '/users' },
  ];

  protected readonly footerColumns: FooterColumn[] = [
    { heading: 'Product', links: ['Overview', 'Metrics', 'Logs'] },
    { heading: 'Company', links: ['About', 'Careers', 'Contact'] },
    { heading: 'Resources', links: ['Documentation', 'Status', 'Support'] },
  ];

  protected readonly legalLinks = ['Privacy Policy', 'Terms of Service'];

  protected signOut(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
