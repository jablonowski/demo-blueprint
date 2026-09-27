import { Component, HostListener, input, output } from '@angular/core';

/**
 * Modal shell matching the Figma modal frames: header, divider, body, divider, footer.
 * Project `[modal-header]` to replace the plain title, and `[modal-footer]` for actions.
 */
@Component({
  selector: 'app-modal',
  template: `
    <div class="backdrop" (click)="closed.emit()"></div>
    <div class="dialog" [class]="size()" role="dialog" aria-modal="true" [attr.aria-label]="title()">
      <header class="header">
        <div class="header-content">
          @if (title()) {
            <h2 class="title">{{ title() }}</h2>
          }
          <ng-content select="[modal-header]" />
        </div>
        <button class="close" type="button" aria-label="Close" (click)="closed.emit()">✕</button>
      </header>
      <div class="body">
        <ng-content />
      </div>
      <footer class="footer">
        <ng-content select="[modal-footer]" />
      </footer>
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, .45);
      animation: fade var(--duration-base) var(--easing-standard);
    }
    .dialog {
      position: relative;
      display: flex;
      flex-direction: column;
      width: 100%;
      max-height: calc(100vh - 48px);
      background: var(--color-surface-card);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-modal);
      animation: rise var(--duration-base) var(--easing-standard);
    }
    .dialog.sm { max-width: 420px; }
    .dialog.md { max-width: 560px; }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 20px 24px;
      border-bottom: 1px solid var(--color-border);
    }
    .header-content {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .title {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
    }
    .close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      border: none;
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--color-text-muted);
      font-size: var(--font-size-base);
      line-height: 1;
      cursor: pointer;
    }
    .close:hover { background: var(--color-surface-subtle); color: var(--color-text-primary); }
    .body {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 24px;
      overflow-y: auto;
    }
    .footer {
      padding: 16px 24px;
      border-top: 1px solid var(--color-border);
    }
    @keyframes fade { from { opacity: 0; } }
    @keyframes rise { from { opacity: 0; transform: translateY(8px); } }
  `,
})
export class ModalComponent {
  readonly title = input<string>();
  readonly size = input<'sm' | 'md'>('md');
  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
