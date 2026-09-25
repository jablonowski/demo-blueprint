import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent {
  @Input() size: 'sm' | 'md' = 'md';
  @Input() closeOnBackdrop = false;
  @Output() backdropClose = new EventEmitter<void>();

  onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.backdropClose.emit();
    }
  }
}
