import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AppHeaderComponent } from '../header/header.component';
import { AppFooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, AppHeaderComponent, AppFooterComponent],
  template: `
    <app-header (signOut)="signOut()" />
    <main class="content">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .content {
      flex: 1;
      width: 100%;
      max-width: calc(var(--size-content-max) + 2 * var(--space-8));
      margin: 0 auto;
      padding: var(--space-4) var(--space-8) var(--space-8);
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      align-content: start;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  signOut(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
