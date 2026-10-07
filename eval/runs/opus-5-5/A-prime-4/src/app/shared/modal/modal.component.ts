import { Component, HostListener, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    <div class="backdrop" (click)="closed.emit()">
      <div class="modal" [class]="'modal-' + size()" role="dialog" aria-modal="true"
           [attr.aria-label]="title() || null" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <div class="modal-title-wrap">
            @if (title()) {
              <h2 class="modal-title">{{ title() }}</h2>
            }
            <ng-content select="[modal-header]" />
          </div>
          <button type="button" class="close" aria-label="Close" (click)="closed.emit()">✕</button>
        </header>
        <div class="modal-body"><ng-content /></div>
        <footer class="modal-footer" [class.split]="splitFooter()">
          <ng-content select="[modal-footer]" />
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
      width: 100%;
      max-height: calc(100vh - 48px);
      display: flex;
      flex-direction: column;
      background: var(--color-surface-card);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-modal);
      animation: rise var(--duration-base) var(--easing-standard);
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
    .modal-title-wrap { flex: 1; display: flex; align-items: center; gap: 10px; min-width: 0; }
    .modal-title { margin: 0; font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); }
    .close {
      display: inline-flex;
      padding: 6px;
      border: 0;
      border-radius: 5px;
      background: transparent;
      color: var(--color-text-muted);
      font-size: var(--font-size-base);
      line-height: 1;
      cursor: pointer;
    }
    .close:hover { background: var(--color-surface-subtle); color: var(--color-text-primary); }
    .modal-body { padding: 24px; overflow-y: auto; }
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
    @keyframes rise { from { opacity: 0; transform: translateY(8px); } }
  `,
})
export class ModalComponent {
  title = input<string>('');
  size = input<'sm' | 'md'>('md');
  splitFooter = input(false);
  closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
