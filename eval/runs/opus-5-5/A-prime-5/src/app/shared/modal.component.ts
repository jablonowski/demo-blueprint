import { Component, HostListener, input, output } from '@angular/core';

/** Modal shell: backdrop, panel, header (title or custom), body, footer slots. */
@Component({
  selector: 'app-modal',
  template: `
    <div class="backdrop" (click)="closed.emit()"></div>
    <div class="panel" [class.sm]="size() === 'sm'" role="dialog" aria-modal="true" [attr.aria-label]="title()">
      <header class="header">
        @if (title()) {
          <h2 class="title">{{ title() }}</h2>
        } @else {
          <div class="title-custom"><ng-content select="[modal-header]" /></div>
        }
        <button type="button" class="close" aria-label="Close" (click)="closed.emit()">✕</button>
      </header>
      <div class="body"><ng-content /></div>
      <footer class="footer"><ng-content select="[modal-footer]" /></footer>
    </div>
  `,
  styles: `
    :host { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .backdrop { position: absolute; inset: 0; background: rgba(0, 0, 0, .45); }
    .panel {
      position: relative;
      width: 100%;
      max-width: 560px;
      max-height: calc(100vh - 48px);
      overflow-y: auto;
      background: var(--color-surface-card);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-modal);
    }
    .panel.sm { max-width: 420px; }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 20px 24px;
      border-bottom: 1px solid var(--color-border);
    }
    .title, .title-custom { flex: 1; margin: 0; font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); }
    .title-custom { display: flex; align-items: center; gap: 10px; }
    .close {
      display: inline-flex;
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
    .body { display: flex; flex-direction: column; gap: 16px; padding: 24px; }
    .footer { padding: 16px 24px; border-top: 1px solid var(--color-border); }
  `,
})
export class ModalComponent {
  readonly title = input<string>('');
  readonly size = input<'sm' | 'md'>('md');
  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
