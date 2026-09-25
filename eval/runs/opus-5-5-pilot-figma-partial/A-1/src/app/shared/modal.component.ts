import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

/**
 * Modal shell matching Figma nodes 22:11448 / 22:11492:
 * header (title or custom content + close), divider, padded body, divider, footer.
 */
@Component({
  selector: 'app-modal',
  template: `
    <div class="backdrop" (click)="closed.emit()"></div>
    <section
      class="modal"
      [class.modal--sm]="size() === 'sm'"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="titleId"
    >
      <header class="modal__header">
        <div class="modal__title" [id]="titleId">
          @if (heading()) {
            <h2>{{ heading() }}</h2>
          }
          <ng-content select="[modalHeader]" />
        </div>
        <button type="button" class="modal__close" aria-label="Close" (click)="closed.emit()">✕</button>
      </header>
      <div class="modal__body">
        <ng-content />
      </div>
      <footer class="modal__footer">
        <ng-content select="[modalFooter]" />
      </footer>
    </section>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: var(--z-modal);
      display: grid;
      place-items: center;
      padding: var(--space-6);
    }
    .backdrop {
      position: absolute;
      inset: 0;
      background: var(--color-backdrop);
    }
    .modal {
      position: relative;
      width: 100%;
      max-width: var(--width-modal-md);
      max-height: calc(100vh - 2 * var(--space-6));
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--color-bg-surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-modal);
    }
    .modal--sm { max-width: var(--width-modal-sm); }
    .modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-5) var(--space-6);
      border-bottom: var(--border-width) solid var(--color-border);
    }
    .modal__title {
      display: flex;
      align-items: center;
      gap: var(--space-2-5);
      flex: 1;
      min-width: 0;
    }
    .modal__title h2,
    .modal__title ::ng-deep h2 {
      font-size: var(--text-xl);
      font-weight: var(--weight-semibold);
      line-height: var(--leading-tight);
    }
    .modal__close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-1-5);
      border: 0;
      border-radius: var(--radius-icon-btn);
      background: transparent;
      color: var(--color-text-muted);
      font-size: var(--text-md);
      line-height: 1;
      cursor: pointer;
      &:hover { background: var(--color-bg-muted); color: var(--color-text-primary); }
      &:focus-visible { outline: none; box-shadow: var(--focus-ring); }
    }
    .modal__body {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-6);
      overflow-y: auto;
    }
    .modal__footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-2);
      padding: var(--space-4) var(--space-6);
      border-top: var(--border-width) solid var(--color-border);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  private static nextId = 0;

  readonly heading = input<string>('');
  readonly size = input<'sm' | 'md'>('md');
  readonly closed = output<void>();

  protected readonly titleId = `modal-title-${ModalComponent.nextId++}`;

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closed.emit();
  }
}
