import { Component, HostListener, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    <div class="backdrop" (click)="closeOnBackdrop() && closed.emit()">
      <div class="modal" [class]="'modal size-' + size()" role="dialog" aria-modal="true"
           [attr.aria-label]="title() || null" (click)="$event.stopPropagation()">
        <header class="modal-header">
          @if (title()) {
            <h2 class="modal-title">{{ title() }}</h2>
          } @else {
            <ng-content select="[modal-header]" />
          }
          <button type="button" class="modal-close" aria-label="Close" (click)="closed.emit()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div class="modal-body">
          <ng-content />
        </div>
        <footer class="modal-footer">
          <ng-content select="[modal-footer]" />
        </footer>
      </div>
    </div>
  `,
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  title = input<string>('');
  size = input<'sm' | 'md'>('md');
  closeOnBackdrop = input(true);
  closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
