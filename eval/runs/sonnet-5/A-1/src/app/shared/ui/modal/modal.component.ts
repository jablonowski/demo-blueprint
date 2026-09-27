import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

export type ModalSize = 'sm' | 'md';

@Component({
  selector: 'ui-modal',
  standalone: true,
  template: `
    <div class="ui-modal-backdrop" (click)="onBackdropClick()">
      <div
        class="ui-modal"
        [class.ui-modal--sm]="size === 'sm'"
        role="dialog"
        aria-modal="true"
        (click)="$event.stopPropagation()"
      >
        <ng-content select="[modalHeader]" />
        <div class="ui-modal__divider"></div>
        <div class="ui-modal__body">
          <ng-content select="[modalBody]" />
        </div>
        <div class="ui-modal__divider"></div>
        <ng-content select="[modalFooter]" />
      </div>
    </div>
  `,
  styleUrl: './modal.component.css'
})
export class ModalComponent {
  @Input() size: ModalSize = 'md';
  @Input() closeOnBackdropClick = true;
  @Output() closed = new EventEmitter<void>();

  onBackdropClick(): void {
    if (this.closeOnBackdropClick) {
      this.closed.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
