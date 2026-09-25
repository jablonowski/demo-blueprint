import { Component, HostListener, input, output } from '@angular/core';

export type ModalSize = 'sm' | 'md';

/**
 * Modal shell. Provide either a `heading` or project a custom header with
 * `[modal-header]`; the body is the default slot and the footer is `[modal-footer]`.
 */
@Component({
  selector: 'app-modal',
  template: `
    <div class="backdrop" (click)="closed.emit()">
      <div
        class="modal modal--{{ size() }}"
        role="dialog"
        aria-modal="true"
        (click)="$event.stopPropagation()"
      >
        <header class="modal__header">
          @if (heading()) {
            <h2 class="modal__title">{{ heading() }}</h2>
          }
          <ng-content select="[modal-header]" />
          <button type="button" class="modal__close" aria-label="Close" (click)="closed.emit()">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </header>
        <div class="modal__body"><ng-content /></div>
        <footer class="modal__footer"><ng-content select="[modal-footer]" /></footer>
      </div>
    </div>
  `,
  styles: `
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: var(--z-modal);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4);
      background: var(--color-overlay);
    }
    .modal {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-height: calc(100vh - 2 * var(--space-8));
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
    }
    .modal--sm { max-width: var(--modal-sm); }
    .modal--md { max-width: var(--modal-md); }
    .modal__header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-6) var(--space-6) 0;
    }
    .modal__title {
      font-size: var(--text-lg);
      font-weight: var(--weight-semibold);
      line-height: var(--leading-tight);
    }
    .modal__close {
      display: inline-flex;
      margin-left: auto;
      padding: var(--space-1);
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-fg-muted);
      cursor: pointer;
    }
    .modal__close:hover { background: var(--color-bg-muted); color: var(--color-fg); }
    .modal__body {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-5) var(--space-6);
      overflow-y: auto;
    }
    .modal__footer {
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--color-border);
    }
  `,
})
export class ModalComponent {
  readonly heading = input<string>();
  readonly size = input<ModalSize>('md');
  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
