import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FooterComponent, FooterColumn, FooterLink } from '@jablonowski/dsb-components';
import { UserMenuComponent } from './user-menu.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FooterComponent, UserMenuComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent {
  readonly footerColumns: FooterColumn[] = [
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

  readonly legalLinks: FooterLink[] = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' }
  ];
}
