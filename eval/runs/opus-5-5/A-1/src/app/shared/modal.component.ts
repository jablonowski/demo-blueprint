import { Component, HostListener, input, output } from '@angular/core';

/**
 * Modal shell: backdrop, panel, header, body and footer slots.
 * Pass `title` for a plain header, or project `[modal-header]` for a custom one.
 */
@Component({
  selector: 'app-modal',
  template: `
    <div class="backdrop" (click)="closed.emit()"></div>
    <div class="panel" [class.sm]="size() === 'sm'" role="dialog" aria-modal="true" [attr.aria-label]="title()">
      <header class="header">
        <div class="header-main">
          @if (title()) {
            <h2 class="title">{{ title() }}</h2>
          }
          <ng-content select="[modal-header]" />
        </div>
        <button type="button" class="close" aria-label="Close" (click)="closed.emit()">✕</button>
      </header>
      <div class="body"><ng-content /></div>
      <footer class="footer" [class.split]="splitFooter()"><ng-content select="[modal-footer]" /></footer>
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: grid;
      place-items: center;
      padding: var(--sp-6);
    }
    .backdrop { position: absolute; inset: 0; background: var(--c-backdrop); }
    .panel {
      position: relative;
      width: 100%;
      max-width: var(--dialog-md);
      max-height: calc(100vh - 2 * var(--sp-6));
      display: flex;
      flex-direction: column;
      background: var(--c-surface);
      border-radius: var(--radius-dialog);
      box-shadow: var(--shadow-dialog);
      overflow: hidden;
    }
    .panel.sm { max-width: var(--dialog-sm); }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--sp-3-5);
      padding: var(--sp-6) var(--sp-7);
      border-bottom: var(--border-w) solid var(--c-border);
    }
    .header-main { display: flex; align-items: center; gap: var(--sp-3); flex: 1; min-width: 0; }
    .title { font-size: var(--fs-xl); font-weight: var(--fw-semibold); color: var(--c-fg); }
    .close {
      display: inline-flex;
      padding: var(--sp-2);
      border: 0;
      border-radius: var(--radius-control);
      background: transparent;
      color: var(--c-fg-subtle);
      font-size: var(--fs-base);
      line-height: 1;
      cursor: pointer;
    }
    .close:hover { background: var(--c-canvas); color: var(--c-fg); }
    .body {
      display: flex;
      flex-direction: column;
      gap: var(--sp-5);
      padding: var(--sp-7);
      overflow-y: auto;
      font-size: var(--fs-base);
      line-height: 1.5;
      color: var(--c-fg-strong);
    }
    .footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--sp-2-5);
      padding: var(--sp-5) var(--sp-7);
      border-top: var(--border-w) solid var(--c-border);
    }
    .footer.split { justify-content: space-between; }
  `,
})
export class ModalComponent {
  readonly title = input<string>('');
  readonly size = input<'sm' | 'md'>('md');
  readonly splitFooter = input(false);
  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
