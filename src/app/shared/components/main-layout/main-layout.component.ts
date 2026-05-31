import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderComponent, FooterComponent } from '@jablonowski/dsb-components';
import { UserProfileMenuComponent } from '../user-profile-menu/user-profile-menu.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, UserProfileMenuComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Users',     href: '/users' }
  ];

  footerColumns = [
    { heading: 'Product', links: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Users', href: '/users' }] },
    { heading: 'Support', links: [{ label: 'Documentation', href: '#' }, { label: 'Help Center', href: '#' }] }
  ];

  legalLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' }
  ];

  onSignOut() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
