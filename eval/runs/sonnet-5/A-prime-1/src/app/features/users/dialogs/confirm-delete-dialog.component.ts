import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  templateUrl: './confirm-delete-dialog.component.html',
  styleUrls: ['./modal-shared.css'],
})
export class ConfirmDeleteDialogComponent {
  @Input({ required: true }) user!: User;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
