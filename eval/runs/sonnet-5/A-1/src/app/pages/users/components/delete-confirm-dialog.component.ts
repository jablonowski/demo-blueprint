import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { ButtonDirective } from '../../../shared/ui/button/button.directive';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-delete-confirm-dialog',
  standalone: true,
  imports: [ModalComponent, ButtonDirective],
  template: `
    <ui-modal size="sm" (closed)="cancelled.emit()">
      <div modalHeader class="dialog-header">
        <h2 class="dialog-header__title">Confirm Deletion</h2>
        <button class="dialog-header__close" type="button" (click)="cancelled.emit()">✕</button>
      </div>

      <p modalBody class="delete-confirm__body">
        Are you sure you want to remove <strong>{{ user.name }}</strong
        >? This action cannot be undone.
      </p>

      <div modalFooter class="dialog-footer">
        <button uiButton variant="secondary" type="button" (click)="cancelled.emit()">Cancel</button>
        <button uiButton variant="destructive" type="button" (click)="confirmed.emit()">Delete</button>
      </div>
    </ui-modal>
  `,
  styles: [
    `
      .delete-confirm__body {
        margin: 0;
        font-size: var(--text-base);
        color: var(--color-text);
        line-height: 1.5;
      }
    `
  ]
})
export class DeleteConfirmDialogComponent {
  @Input({ required: true }) user!: User;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
