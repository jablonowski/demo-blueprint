import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Modal shell matching the Figma modal frames: header, divider, body, divider, footer.
 * Pass `title` for a plain heading, or project `[dialogHeader]` for a custom one.
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
      [attr.aria-labelledby]="labelId"
    >
      <header class="dialog__header">
        <div class="dialog__title" [id]="labelId">
          @if (title()) {
            <h2>{{ title() }}</h2>
          }
          <ng-content select="[dialogHeader]" />
        </div>
        <button type="button" class="dialog__close" aria-label="Close dialog" (click)="closed.emit()">✕</button>
      </header>
      <div class="dialog__body"><ng-content /></div>
      <footer class="dialog__footer" [class.dialog__footer--split]="splitFooter()">
        <ng-content select="[dialogFooter]" />
      </footer>
    </section>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: var(--z-dialog);
      display: grid;
      place-items: center;
      padding: var(--space-4);
    }
    .backdrop {
      position: absolute;
      inset: 0;
      background: var(--surface-backdrop);
    }
    .dialog {
      position: relative;
      width: 100%;
      max-width: var(--size-dialog-md);
      max-height: calc(100vh - var(--space-8));
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--surface-card);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-overlay);
    }
    .dialog--sm { max-width: var(--size-dialog-sm); }
    .dialog__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-5) var(--space-6);
      border-bottom: var(--border-width) solid var(--border-default);
    }
    .dialog__title {
      display: flex;
      flex: 1;
      align-items: center;
      gap: var(--space-2-5);
      min-width: 0;
    }
    .dialog__title h2,
    .dialog__title ::ng-deep h2 {
      font-size: var(--text-xl);
      font-weight: var(--weight-semibold);
      line-height: var(--leading-tight);
    }
    .dialog__close {
      display: inline-flex;
      padding: var(--space-1-5);
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-muted);
      font-size: var(--text-base);
      line-height: var(--leading-none);
      cursor: pointer;
    }
    .dialog__close:hover { background: var(--surface-hover); color: var(--text-primary); }
    .dialog__close:focus-visible { outline: none; box-shadow: var(--focus-ring); }
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
      border-top: var(--border-width) solid var(--border-default);
    }
    .dialog__footer--split { justify-content: space-between; }
  `,
})
export class DialogComponent {
  private static nextId = 0;

  readonly title = input<string>('');
  readonly size = input<'sm' | 'md'>('md');
  readonly splitFooter = input(false);
  readonly closed = output<void>();

  protected readonly labelId = `dialog-title-${DialogComponent.nextId++}`;
}
