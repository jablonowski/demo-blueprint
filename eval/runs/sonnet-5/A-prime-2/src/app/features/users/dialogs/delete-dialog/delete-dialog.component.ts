import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-delete-dialog',
  standalone: true,
  imports: [ModalComponent],
  templateUrl: './delete-dialog.component.html',
  styleUrl: './delete-dialog.component.css',
})
export class DeleteDialogComponent {
  @Input({ required: true }) user!: User;
  @Output() dismiss = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}
