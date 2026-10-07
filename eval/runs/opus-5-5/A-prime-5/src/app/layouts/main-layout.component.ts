import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <a class="brand" routerLink="/dashboard">
        <span class="logo" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 2h6a3 3 0 0 1 1.8 5.4A3.2 3.2 0 0 1 9.5 14H3z" fill="currentColor"/></svg>
        </span>
        Blueprint
      </a>

      <nav class="links">
        <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        <a routerLink="/users" routerLinkActive="active">Users</a>
      </nav>

      <div class="profile">
        <button type="button" class="profile-trigger" (click)="menuOpen.set(!menuOpen())"
                [attr.aria-expanded]="menuOpen()" aria-haspopup="menu">
          <span class="avatar">AU</span>
          <span class="profile-name">Admin User</span>
          <span class="caret" aria-hidden="true">▾</span>
        </button>
        @if (menuOpen()) {
          <div class="menu" role="menu">
            <button type="button" role="menuitem" class="menu-item" (click)="menuOpen.set(false)">My Profile</button>
            <div class="menu-divider"></div>
            <button type="button" role="menuitem" class="menu-item danger" (click)="signOut()">Sign Out</button>
          </div>
        }
      </div>
    </header>

    <main class="content">
      <router-outlet />
    </main>

    <footer class="footer">
      <div class="footer-top">
        <div class="footer-brand">
          <span class="brand">
            <span class="logo" aria-hidden="true">
              <svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 2h6a3 3 0 0 1 1.8 5.4A3.2 3.2 0 0 1 9.5 14H3z" fill="currentColor"/></svg>
            </span>
            Blueprint
          </span>
          <p class="copyright">© 2026 Blueprint. All rights reserved.</p>
        </div>
        <div class="footer-cols">
          @for (col of columns; track col.title) {
            <div class="footer-col">
              <span class="col-title">{{ col.title }}</span>
              @for (link of col.links; track link) {
                <a href="#" (click)="$event.preventDefault()">{{ link }}</a>
              }
            </div>
          }
        </div>
      </div>
      <div class="footer-legal">
        <a href="#" (click)="$event.preventDefault()">Privacy Policy</a>
        <a href="#" (click)="$event.preventDefault()">Terms of Service</a>
      </div>
    </footer>
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100vh; background: var(--color-surface-subtle); }

    .navbar {
      position: sticky;
      top: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 56px;
      padding: 0 32px;
      background: var(--color-surface-card);
      border-bottom: 1px solid var(--color-border);
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      text-decoration: none;
    }
    .logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: var(--radius-md);
      background: var(--color-primary);
      color: var(--color-surface-card);
    }
    .links { flex: 1; display: flex; align-items: center; gap: 24px; padding-left: 40px; }
    .links a {
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
      text-decoration: none;
      transition: color var(--duration-fast) var(--easing-standard);
    }
    .links a:hover, .links a.active { color: var(--color-text-primary); }
    .links a.active { font-weight: var(--font-weight-medium); }

    .profile { position: relative; }
    .profile-trigger {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px 4px 4px;
      border: none;
      border-radius: var(--radius-lg);
      background: transparent;
      color: var(--color-text-primary);
      cursor: pointer;
      transition: background var(--duration-fast) var(--easing-standard);
    }
    .profile-trigger:hover { background: var(--color-surface-subtle); }
    .profile-name { font-size: var(--font-size-base); font-weight: var(--font-weight-medium); }
    .caret { font-size: var(--font-size-sm); color: var(--color-text-muted); }
    .menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      min-width: 180px;
      padding: 4px;
      background: var(--color-surface-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-modal);
    }
    .menu-item {
      display: block;
      width: 100%;
      padding: 8px 12px;
      border: none;
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--color-text-primary);
      font-size: var(--font-size-base);
      text-align: left;
      cursor: pointer;
    }
    .menu-item:hover { background: var(--color-surface-subtle); }
    .menu-item.danger { color: var(--color-danger); }
    .menu-divider { height: 1px; margin: 4px 0; background: var(--color-border); }

    .content { flex: 1; width: 100%; max-width: 1280px; margin: 0 auto; padding: 20px 32px 32px; }

    .footer {
      padding: 32px 32px 0;
      background: var(--color-surface-card);
      border-top: 1px solid var(--color-border);
    }
    .footer-top { display: flex; justify-content: space-between; gap: 32px; flex-wrap: wrap; padding-bottom: 24px; }
    .footer-brand { display: flex; flex-direction: column; gap: 8px; }
    .copyright { margin: 0; font-size: var(--font-size-sm); color: var(--color-text-muted); }
    .footer-cols { display: flex; gap: 64px; flex-wrap: wrap; }
    .footer-col { display: flex; flex-direction: column; gap: 8px; }
    .col-title {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      letter-spacing: .06em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }
    .footer-col a, .footer-legal a {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      text-decoration: none;
    }
    .footer-col a:hover, .footer-legal a:hover { color: var(--color-text-primary); }
    .footer-legal {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 24px;
      height: 56px;
      border-top: 1px solid var(--color-border);
    }
    .footer-legal a { color: var(--color-text-muted); }

    @media (max-width: 720px) {
      .navbar, .footer { padding-left: 16px; padding-right: 16px; }
      .links { padding-left: 16px; gap: 16px; }
      .profile-name { display: none; }
      .content { padding: 16px; }
    }
  `,
})
export class MainLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);

  readonly menuOpen = signal(false);
  readonly columns = [
    { title: 'Product', links: ['Overview', 'Metrics', 'Logs'] },
    { title: 'Company', links: ['About', 'Careers', 'Contact'] },
    { title: 'Resources', links: ['Documentation', 'Support', 'Status'] },
  ];

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const profile = this.host.nativeElement.querySelector('.profile');
    if (this.menuOpen() && profile && !profile.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  signOut(): void {
    this.menuOpen.set(false);
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
