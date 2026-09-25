import { Component, HostListener, input, output } from '@angular/core';

/**
 * Modal shell. Pass `title` for a plain header, or project `[modal-header]` for a custom one.
 * Body is the default slot; actions go in `[modal-footer]`.
 */
@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  readonly size = input<'sm' | 'md'>('md');
  readonly title = input<string>();
  readonly footerAlign = input<'end' | 'split'>('end');
  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  close(): void {
    this.closed.emit();
  }
}
