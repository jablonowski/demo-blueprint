import { Component, inject, OnInit } from '@angular/core';
import { User, roleTone, statusTone } from '../../core/models/user.model';
import { UsersService } from '../../core/services/users.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { UserDetailsDialogComponent } from './dialogs/user-details-dialog.component';
import { UserEditDialogComponent, UserEditFormValue } from './dialogs/user-edit-dialog.component';
import { UserInviteDialogComponent, UserInviteFormValue } from './dialogs/user-invite-dialog.component';
import { ConfirmDeleteDialogComponent } from './dialogs/confirm-delete-dialog.component';

type ActiveDialog = 'details' | 'edit' | 'delete' | 'invite' | null;

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    AvatarComponent,
    BadgeComponent,
    UserDetailsDialogComponent,
    UserEditDialogComponent,
    UserInviteDialogComponent,
    ConfirmDeleteDialogComponent
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);

  users: User[] = [];
  selectedUser: User | null = null;
  activeDialog: ActiveDialog = null;

  roleTone = roleTone;
  statusTone = statusTone;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.usersService.getAll().subscribe((users) => (this.users = users));
  }

  openDetails(user: User): void {
    this.selectedUser = user;
    this.activeDialog = 'details';
  }

  openEdit(user: User): void {
    this.selectedUser = user;
    this.activeDialog = 'edit';
  }

  openDeleteFromRow(user: User): void {
    this.selectedUser = user;
    this.activeDialog = 'delete';
  }

  openDeleteFromEdit(user: User): void {
    this.selectedUser = user;
    this.activeDialog = 'delete';
  }

  openInvite(): void {
    this.activeDialog = 'invite';
  }

  closeDialog(): void {
    this.activeDialog = null;
    this.selectedUser = null;
  }

  onEditSave(fields: UserEditFormValue): void {
    if (!this.selectedUser) return;
    const name = `${fields.firstName} ${fields.lastName}`.trim();
    const updated: User = { ...this.selectedUser, email: fields.email, role: fields.role, name };
    this.usersService.update(updated.id, updated).subscribe(() => {
      this.loadUsers();
      this.closeDialog();
    });
  }

  onConfirmDelete(): void {
    if (!this.selectedUser) return;
    this.usersService.delete(this.selectedUser.id).subscribe(() => {
      this.loadUsers();
      this.closeDialog();
    });
  }

  formatJoined(isoDate: string): string {
    return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  onInviteSend(fields: UserInviteFormValue): void {
    const name = `${fields.firstName} ${fields.lastName}`.trim();
    this.usersService
      .create({
        name,
        email: fields.email,
        role: fields.role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        status: 'Active',
        joinedDate: new Date().toISOString().slice(0, 10)
      })
      .subscribe(() => {
        this.loadUsers();
        this.closeDialog();
      });
  }
}
