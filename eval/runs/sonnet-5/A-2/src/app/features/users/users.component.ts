import { Component, OnInit } from '@angular/core';
import { User } from '../../core/models/user.model';
import { UsersService } from '../../core/services/users.service';
import { UserAvatarComponent } from './components/user-avatar/user-avatar.component';
import { BadgeComponent } from './components/badge/badge.component';
import { DeleteConfirmDialogComponent } from './dialogs/delete-confirm-dialog/delete-confirm-dialog.component';
import { MemberDetailsDialogComponent } from './dialogs/member-details-dialog/member-details-dialog.component';
import { MemberFormDialogComponent, MemberFormValue } from './dialogs/member-form-dialog/member-form-dialog.component';
import { combineName } from '../../core/utils/name.util';

type DialogState =
  | { kind: 'none' }
  | { kind: 'details'; user: User }
  | { kind: 'edit'; user: User }
  | { kind: 'invite' }
  | { kind: 'delete'; user: User };

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [UserAvatarComponent, BadgeComponent, DeleteConfirmDialogComponent, MemberDetailsDialogComponent, MemberFormDialogComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  dialog: DialogState = { kind: 'none' };

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.usersService.getAll().subscribe((users) => (this.users = users));
  }

  openInvite(): void {
    this.dialog = { kind: 'invite' };
  }

  openDetails(user: User): void {
    this.dialog = { kind: 'details', user };
  }

  openEdit(user: User): void {
    this.dialog = { kind: 'edit', user };
  }

  openDelete(user: User): void {
    this.dialog = { kind: 'delete', user };
  }

  closeDialog(): void {
    this.dialog = { kind: 'none' };
  }

  confirmDelete(): void {
    if (this.dialog.kind !== 'delete') return;
    const id = this.dialog.user.id;
    this.usersService.delete(id).subscribe(() => {
      this.loadUsers();
      this.closeDialog();
    });
  }

  saveEdit(value: MemberFormValue): void {
    if (this.dialog.kind !== 'edit') return;
    const id = this.dialog.user.id;
    this.usersService
      .update(id, {
        name: combineName(value.firstName, value.lastName),
        email: value.email,
        role: value.role
      })
      .subscribe(() => {
        this.loadUsers();
        this.closeDialog();
      });
  }

  sendInvite(value: MemberFormValue): void {
    const today = new Date().toISOString().slice(0, 10);
    const name = combineName(value.firstName, value.lastName);
    this.usersService
      .create({
        name,
        email: value.email,
        role: value.role,
        status: 'Active',
        joinedDate: today,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
      })
      .subscribe(() => {
        this.loadUsers();
        this.closeDialog();
      });
  }

  deleteFromEdit(): void {
    if (this.dialog.kind !== 'edit') return;
    this.dialog = { kind: 'delete', user: this.dialog.user };
  }
}
