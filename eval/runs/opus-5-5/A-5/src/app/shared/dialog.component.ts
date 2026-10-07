import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Modal shell matched to Figma nodes 22:11448 / 22:11492: header, divider, body,
 * divider, footer. Pass `title` for a plain header, or project `[dialog-title]`
 * content for a custom one. Footer layout is set with `footerAlign`.
 */
@Component({
  selector: 'app-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="backdrop" (click)="closed.emit()"></div>
    <section
      class="dialog"
      [class.dialog--sm]="size() === 'sm'"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="title() || null"
    >
      <header class="dialog__header">
        <div class="dialog__title">
          @if (title()) {
            <h2>{{ title() }}</h2>
          }
          <ng-content select="[dialog-title]" />
        </div>
        <button type="button" class="dialog__close" aria-label="Close" (click)="closed.emit()">✕</button>
      </header>
      <div class="dialog__body">
        <ng-content />
      </div>
      <footer class="dialog__footer" [class.dialog__footer--split]="footerAlign() === 'split'">
        <ng-content select="[dialog-footer]" />
      </footer>
    </section>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: var(--z-dialog);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4);
    }
    .backdrop {
      position: absolute;
      inset: 0;
      background: var(--color-backdrop);
    }
    .dialog {
      position: relative;
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: var(--dialog-md);
      max-height: calc(100vh - 2 * var(--space-4));
      overflow: auto;
      background: var(--color-bg-surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-overlay);
    }
    .dialog--sm { max-width: var(--dialog-sm); }
    .dialog__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-5) var(--space-6);
      border-bottom: var(--border-width) solid var(--color-border);
    }
    .dialog__title {
      display: flex;
      flex: 1;
      align-items: center;
      gap: var(--space-2-5);
      min-width: 0;
    }
    h2 {
      font-size: var(--text-xl);
      font-weight: var(--weight-semibold);
      line-height: var(--leading-tight);
    }
    .dialog__close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-1-5);
      border: 0;
      border-radius: var(--radius-icon-button);
      background: transparent;
      color: var(--color-fg-muted);
      font-size: var(--text-base);
      line-height: 1;
      cursor: pointer;
      &:hover { background: var(--color-bg-page); color: var(--color-fg); }
    }
    .dialog__body {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-6);
    }
    .dialog__footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-2);
      padding: var(--space-4) var(--space-6);
      border-top: var(--border-width) solid var(--color-border);
    }
    .dialog__footer--split { justify-content: space-between; }
  `,
})
export class DialogComponent {
  readonly title = input<string>('');
  readonly size = input<'sm' | 'md'>('md');
  readonly footerAlign = input<'end' | 'split'>('end');
  readonly closed = output<void>();
}
