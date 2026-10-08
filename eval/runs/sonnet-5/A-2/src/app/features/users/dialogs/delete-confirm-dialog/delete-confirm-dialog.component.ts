import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalShellComponent } from '../../../../shared/components/modal-shell/modal-shell.component';

@Component({
  selector: 'app-delete-confirm-dialog',
  standalone: true,
  imports: [ModalShellComponent],
  templateUrl: './delete-confirm-dialog.component.html'
})
export class DeleteConfirmDialogComponent {
  @Input({ required: true }) memberName!: string;
  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}
