import { Component, HostListener, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    <div class="backdrop" (click)="closed.emit()"></div>
    <div class="dialog" [class.dialog--sm]="size() === 'sm'" role="dialog" aria-modal="true" [attr.aria-label]="title() || null">
      <header class="dialog__header">
        @if (title()) {
          <h2 class="dialog__title">{{ title() }}</h2>
        } @else {
          <ng-content select="[modal-header]" />
        }
      </header>
      <div class="dialog__body"><ng-content /></div>
      <footer class="dialog__footer"><ng-content select="[modal-footer]" /></footer>
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: var(--z-modal);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4);
    }
    .backdrop { position: absolute; inset: 0; background: var(--bg-overlay); }
    .dialog {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      width: 100%;
      max-width: var(--modal-width-md);
      max-height: 100%;
      overflow-y: auto;
      padding: var(--space-6);
      background: var(--bg-surface);
      border: var(--border-width) solid var(--border-default);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
    }
    .dialog--sm { max-width: var(--modal-width-sm); }
    .dialog__title,
    .dialog__header ::ng-deep h2 {
      font-size: var(--text-lg);
      font-weight: var(--weight-semibold);
      line-height: var(--leading-tight);
    }
    .dialog__body { display: flex; flex-direction: column; gap: var(--space-4); }
    .dialog__footer ::ng-deep > * {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
  `
})
export class ModalComponent {
  readonly title = input<string>('');
  readonly size = input<'sm' | 'md'>('md');
  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closed.emit();
  }
}
