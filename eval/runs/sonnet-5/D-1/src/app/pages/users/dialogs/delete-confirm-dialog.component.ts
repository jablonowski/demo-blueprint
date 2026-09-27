import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent, ModalComponent } from '@jablonowski/dsb-components';
import { Member } from '../../../core/models/user.model';

@Component({
  selector: 'app-delete-confirm-dialog',
  standalone: true,
  imports: [ModalComponent, ButtonComponent],
  templateUrl: './delete-confirm-dialog.component.html',
  styleUrl: './delete-confirm-dialog.component.css'
})
export class DeleteConfirmDialogComponent {
  @Input() open = false;
  @Input() member: Member | null = null;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() confirmed = new EventEmitter<void>();

  onOpenChange(open: boolean): void {
    this.openChange.emit(open);
  }

  cancel(): void {
    this.openChange.emit(false);
  }

  confirm(): void {
    this.confirmed.emit();
  }
}
