import { Component, OnInit } from '@angular/core';
import { User, UserRole } from '../../core/models/user.model';
import { UsersService } from '../../core/services/users.service';
import { roleTagClass, statusTagClass } from './badge-classes';
import { ConfirmDeleteDialogComponent } from './dialogs/confirm-delete-dialog.component';
import { MemberDetailsDialogComponent } from './dialogs/member-details-dialog.component';
import { EditMemberDialogComponent, EditMemberResult } from './dialogs/edit-member-dialog.component';
import { InviteMemberDialogComponent, InviteMemberResult } from './dialogs/invite-member-dialog.component';

type DialogKind = 'none' | 'details' | 'edit' | 'delete' | 'invite';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    ConfirmDeleteDialogComponent,
    MemberDetailsDialogComponent,
    EditMemberDialogComponent,
    InviteMemberDialogComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  selectedUser: User | null = null;
  activeDialog: DialogKind = 'none';
  brokenAvatarIds = new Set<number>();

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.usersService.getAll().subscribe((users) => (this.users = users));
  }

  roleTagClass(role: UserRole): string {
    return roleTagClass(role);
  }

  statusTagClass(status: User['status']): string {
    return statusTagClass(status);
  }

  onAvatarError(id: number): void {
    this.brokenAvatarIds.add(id);
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }

  openDetails(user: User): void {
    this.selectedUser = user;
    this.activeDialog = 'details';
  }

  openEdit(user: User): void {
    this.selectedUser = user;
    this.activeDialog = 'edit';
  }

  openDeleteFor(user: User): void {
    this.selectedUser = user;
    this.activeDialog = 'delete';
  }

  openInvite(): void {
    this.activeDialog = 'invite';
  }

  closeDialog(): void {
    this.activeDialog = 'none';
    this.selectedUser = null;
  }

  switchToDeleteFromEdit(): void {
    this.activeDialog = 'delete';
  }

  confirmDelete(): void {
    if (!this.selectedUser) {
      return;
    }
    const id = this.selectedUser.id;
    this.usersService.delete(id).subscribe(() => {
      this.loadUsers();
      this.closeDialog();
    });
  }

  saveEdit(result: EditMemberResult): void {
    if (!this.selectedUser) {
      return;
    }
    const merged: User = { ...this.selectedUser, ...result };
    this.usersService.update(this.selectedUser.id, merged).subscribe(() => {
      this.loadUsers();
      this.closeDialog();
    });
  }

  sendInvite(result: InviteMemberResult): void {
    const today = new Date().toISOString().slice(0, 10);
    const newUser: Partial<User> = {
      name: result.name,
      email: result.email,
      role: result.role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(result.name)}`,
      status: 'Active',
      joinedDate: today,
    };
    this.usersService.create(newUser).subscribe(() => {
      this.loadUsers();
      this.closeDialog();
    });
  }
}
