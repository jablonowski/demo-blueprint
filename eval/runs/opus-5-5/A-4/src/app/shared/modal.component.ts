import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

let nextId = 0;

/**
 * Modal shell matching Figma nodes 22:11448 / 22:11492: header, divider, body, divider, footer.
 * Project a custom header with [modalHeader]; otherwise `heading` is rendered as the title.
 * Footer content goes in [modalFooter]; `footerAlign` chooses split or right-aligned.
 */
@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop" (click)="closed.emit()"></div>
    <section
      class="dialog"
      [class.dialog--sm]="size() === 'sm'"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="titleId"
    >
      <header class="dialog__header">
        <div class="dialog__title" [id]="titleId">
          @if (heading()) {
            <h2 class="modal-title">{{ heading() }}</h2>
          }
          <ng-content select="[modalHeader]" />
        </div>
        <button type="button" class="dialog__close" aria-label="Close dialog" (click)="closed.emit()">✕</button>
      </header>
      <hr class="divider" />
      <div class="dialog__body">
        <ng-content />
      </div>
      <hr class="divider" />
      <footer class="dialog__footer" [class.dialog__footer--split]="footerAlign() === 'split'">
        <ng-content select="[modalFooter]" />
      </footer>
    </section>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: var(--z-modal);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-6);
    }
    .backdrop {
      position: absolute;
      inset: 0;
      background: var(--overlay-backdrop);
    }
    .dialog {
      position: relative;
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: var(--size-modal-md);
      max-height: 100%;
      background: var(--surface-card);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-modal);
      overflow: hidden;
    }
    .dialog--sm {
      max-width: var(--size-modal-sm);
    }
    .dialog__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-5) var(--space-6);
    }
    .dialog__title {
      display: flex;
      flex: 1;
      align-items: center;
      gap: var(--space-2);
      min-width: 0;
    }
    .dialog__close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-1-5);
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-muted);
      font-size: var(--font-size-base);
      line-height: 1;
      cursor: pointer;
    }
    .dialog__close:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }
    .dialog__body {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-6);
      overflow-y: auto;
    }
    .dialog__footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-2);
      padding: var(--space-4) var(--space-6);
    }
    .dialog__footer--split {
      justify-content: space-between;
    }
  `,
})
export class ModalComponent {
  readonly heading = input<string>('');
  readonly size = input<'sm' | 'md'>('md');
  readonly footerAlign = input<'end' | 'split'>('end');
  readonly closed = output<void>();

  protected readonly titleId = `modal-title-${++nextId}`;

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closed.emit();
  }
}
