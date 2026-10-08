import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent, ModalComponent } from '@jablonowski/dsb-components';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-delete-confirm-dialog',
  standalone: true,
  imports: [ModalComponent, ButtonComponent],
  templateUrl: './delete-confirm-dialog.component.html',
  styleUrl: './dialog-shared.css',
})
export class DeleteConfirmDialogComponent {
  @Input() open = false;
  @Input() user: User | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
}
