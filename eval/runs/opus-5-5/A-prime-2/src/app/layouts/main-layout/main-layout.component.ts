import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);

  readonly userName = 'Admin User';
  readonly year = new Date().getFullYear();
  menuOpen = signal(false);

  readonly footerColumns = [
    { title: 'Product', links: ['Overview', 'Metrics', 'Logs'] },
    { title: 'Company', links: ['About', 'Careers', 'Contact'] },
    { title: 'Resources', links: ['Documentation', 'Status', 'Support'] },
  ];
  readonly legalLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Policy'];

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const profile = this.host.nativeElement.querySelector('.profile');
    if (this.menuOpen() && profile && !profile.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.menuOpen.set(false);
  }

  signOut() {
    this.menuOpen.set(false);
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
