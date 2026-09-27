import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AvatarComponent } from '@jablonowski/dsb-components';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [AvatarComponent],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.css'
})
export class UserMenuComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private elRef = inject(ElementRef<HTMLElement>);

  open = false;
  readonly userName = 'Admin User';

  toggle(): void {
    this.open = !this.open;
  }

  signOut(): void {
    this.open = false;
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open && !this.elRef.nativeElement.contains(event.target as Node)) {
      this.open = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open = false;
  }
}
