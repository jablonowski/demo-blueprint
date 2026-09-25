import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

/**
 * Modal shell from Figma nodes 22:11448 / 22:11492: header, divider, body, divider, footer.
 * Project `[modal-header]` for a custom header, otherwise `title` is rendered.
 * Project `[modal-footer]` for the footer content.
 */
@Component({
  selector: 'app-modal',
  template: `
    <div class="backdrop" (click)="dismiss.emit()"></div>
    <section
      class="dialog"
      [class.dialog--sm]="size() === 'sm'"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="title() || null"
    >
      <header class="dialog__header">
        <div class="dialog__heading">
          @if (title()) {
            <h2 class="dialog__title">{{ title() }}</h2>
          }
          <ng-content select="[modal-header]" />
        </div>
        <button type="button" class="dialog__close" aria-label="Close" (click)="dismiss.emit()">✕</button>
      </header>
      <div class="dialog__body">
        <ng-content />
      </div>
      <footer class="dialog__footer" [class.dialog__footer--end]="footerAlign() === 'end'">
        <ng-content select="[modal-footer]" />
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
      background: var(--color-bg-backdrop);
    }
    .dialog {
      position: relative;
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: var(--size-modal-md);
      max-height: 100%;
      background: var(--color-bg-surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-overlay);
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
      border-bottom: var(--border-width) solid var(--color-border);
    }
    .dialog__heading {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex: 1;
      min-width: 0;
    }
    .dialog__title {
      font-size: var(--text-xl);
      font-weight: var(--weight-semibold);
      color: var(--color-fg);
    }
    .dialog__close {
      display: inline-flex;
      padding: var(--space-1-5);
      border: 0;
      border-radius: var(--radius-sm-plus);
      background: transparent;
      color: var(--color-fg-subtle);
      font-size: var(--text-base);
      line-height: 1;
      cursor: pointer;
      &:hover { background: var(--color-bg-muted); color: var(--color-fg); }
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
      justify-content: space-between;
      gap: var(--space-2);
      padding: var(--space-4) var(--space-6);
      border-top: var(--border-width) solid var(--color-border);
    }
    .dialog__footer--end {
      justify-content: flex-end;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  readonly title = input<string>('');
  readonly size = input<'sm' | 'md'>('md');
  readonly footerAlign = input<'split' | 'end'>('split');
  readonly dismiss = output<void>();

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.dismiss.emit();
  }
}
