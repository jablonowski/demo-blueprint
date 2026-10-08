import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent, ModalComponent } from '@jablonowski/dsb-components';
import { User } from '../../../core/models/user.model';
import { UsersService } from '../../../core/services/users.service';

@Component({
  selector: 'app-delete-confirm-dialog',
  standalone: true,
  imports: [ModalComponent, ButtonComponent],
  templateUrl: './delete-confirm-dialog.component.html',
  styleUrl: './delete-confirm-dialog.component.css',
})
export class DeleteConfirmDialogComponent {
  @Input() open = false;
  @Input() user: User | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  deleting = false;

  constructor(private usersService: UsersService) {}

  onCancel(): void {
    this.closed.emit();
  }

  onModalClosed(): void {
    this.closed.emit();
  }

  onConfirmDelete(): void {
    if (!this.user) {
      return;
    }
    this.deleting = true;
    this.usersService.delete(this.user.id).subscribe(() => {
      this.deleting = false;
      this.deleted.emit();
    });
  }
}
