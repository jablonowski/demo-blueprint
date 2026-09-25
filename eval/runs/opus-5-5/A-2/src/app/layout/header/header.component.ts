import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LogoComponent } from '../logo.component';
import { AvatarComponent } from '../../shared/avatar.component';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, LogoComponent, AvatarComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeaderComponent {
  readonly signOut = output<void>();

  protected readonly userName = 'Admin User';
  protected readonly menuOpen = signal(false);
  protected readonly navItems = [
    { label: 'Overview', link: '/dashboard' },
    { label: 'Team', link: '/users' },
  ];

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  selectSignOut(): void {
    this.menuOpen.set(false);
    this.signOut.emit();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const menu = this.host.nativeElement.querySelector('.profile');
    if (this.menuOpen() && menu && !menu.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.menuOpen.set(false);
  }
}
