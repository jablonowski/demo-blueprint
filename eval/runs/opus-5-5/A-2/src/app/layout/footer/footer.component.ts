import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LogoComponent } from '../logo.component';

@Component({
  selector: 'app-footer',
  imports: [LogoComponent],
  template: `
    <footer class="footer">
      <div class="footer__top">
        <div class="footer__brand">
          <app-logo />
          <p class="footer__copy">© {{ year }} Blueprint. All rights reserved.</p>
        </div>
        <div class="footer__columns">
          @for (column of columns; track column.title) {
            <div class="footer__column">
              <h3 class="footer__heading">{{ column.title }}</h3>
              @for (link of column.links; track link) {
                <a class="footer__link" href="#" (click)="$event.preventDefault()">{{ link }}</a>
              }
            </div>
          }
        </div>
      </div>
      <div class="footer__legal">
        @for (link of legal; track link) {
          <a class="footer__link" href="#" (click)="$event.preventDefault()">{{ link }}</a>
        }
      </div>
    </footer>
  `,
  styles: `
    .footer {
      padding: 0 var(--space-8);
      background: var(--color-bg-surface);
      border-top: var(--border-width) solid var(--color-border);
    }
    .footer__top {
      display: flex;
      justify-content: space-between;
      gap: var(--space-8);
      padding: var(--space-6) 0;
    }
    .footer__brand {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .footer__copy,
    .footer__link {
      font-size: var(--text-sm);
      color: var(--color-fg-placeholder);
      text-decoration: none;
    }
    .footer__link:hover {
      color: var(--color-fg-secondary);
    }
    .footer__columns {
      display: flex;
      gap: var(--space-10);
    }
    .footer__column {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .footer__heading {
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      letter-spacing: var(--tracking-caps);
      text-transform: uppercase;
      color: var(--color-fg-subtle);
    }
    .footer__legal {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: var(--space-6);
      height: var(--size-header);
      border-top: var(--border-width) solid var(--color-border-subtle);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppFooterComponent {
  protected readonly year = new Date().getFullYear();
  protected readonly columns = [
    { title: 'Product', links: ['Overview', 'Metrics', 'Logs'] },
    { title: 'Company', links: ['About', 'Careers', 'Contact'] },
    { title: 'Resources', links: ['Documentation', 'Status', 'Support'] },
  ];
  protected readonly legal = ['Privacy Policy', 'Terms of Service'];
}
