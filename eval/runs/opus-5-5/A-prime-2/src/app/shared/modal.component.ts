import { Component, HostListener, input, output } from '@angular/core';

/**
 * Modal shell matching Figma nodes 22:11448 / 22:11492: header (20px 24px),
 * divider, body (24px, 16px gap), divider, footer (16px 24px).
 * Pass `heading` for a plain header, or project `[modalHeader]` for a custom one.
 */
@Component({
  selector: 'app-modal',
  template: `
    <div class="backdrop" (click)="closed.emit()">
      <div
        class="modal"
        [class]="'modal-' + size()"
        role="dialog"
        aria-modal="true"
        (click)="$event.stopPropagation()"
      >
        <header class="modal-header">
          <div class="modal-title">
            @if (heading()) {
              <h2>{{ heading() }}</h2>
            }
            <ng-content select="[modalHeader]" />
          </div>
          <button type="button" class="close" aria-label="Close" (click)="closed.emit()">✕</button>
        </header>
        <div class="modal-body"><ng-content /></div>
        <footer class="modal-footer" [class.split]="splitFooter()">
          <ng-content select="[modalFooter]" />
        </footer>
      </div>
    </div>
  `,
  styles: `
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(0, 0, 0, .45);
      animation: fade var(--duration-base) var(--easing-standard);
    }
    .modal {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-height: calc(100vh - 48px);
      background: var(--color-surface-card);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-modal);
      overflow: hidden;
    }
    .modal-sm { max-width: 420px; }
    .modal-md { max-width: 560px; }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 20px 24px;
      border-bottom: 1px solid var(--color-border);
    }
    .modal-title { display: flex; align-items: center; gap: 8px; min-width: 0; }
    h2 { margin: 0; font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); }
    .close {
      display: inline-flex;
      padding: 6px;
      border: 0;
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--color-text-muted);
      font-size: var(--font-size-base);
      line-height: 1;
      cursor: pointer;
    }
    .close:hover { background: var(--color-surface-subtle); color: var(--color-text-primary); }
    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 24px;
      overflow-y: auto;
    }
    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px;
      border-top: 1px solid var(--color-border);
    }
    .modal-footer.split { justify-content: space-between; }
    @keyframes fade { from { opacity: 0; } }
  `,
})
export class ModalComponent {
  heading = input<string>('');
  size = input<'sm' | 'md'>('md');
  splitFooter = input(false);
  closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closed.emit();
  }
}
