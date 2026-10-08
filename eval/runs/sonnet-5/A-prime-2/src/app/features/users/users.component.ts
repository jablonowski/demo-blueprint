import { Component, OnInit, inject } from '@angular/core';
import { User, UserRole } from '../../core/models/user.model';
import { UsersService } from '../../core/services/users.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { BadgeComponent, BadgeTone } from '../../shared/components/badge/badge.component';
import { DeleteDialogComponent } from './dialogs/delete-dialog/delete-dialog.component';
import { DetailsDialogComponent } from './dialogs/details-dialog/details-dialog.component';
import { EditDialogComponent, EditMemberPayload } from './dialogs/edit-dialog/edit-dialog.component';
import { InviteDialogComponent, InviteMemberPayload } from './dialogs/invite-dialog/invite-dialog.component';

const ROLE_TONE: Record<UserRole, BadgeTone> = {
  Admin: 'danger',
  Editor: 'info',
  Viewer: 'default',
};

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    AvatarComponent,
    BadgeComponent,
    DeleteDialogComponent,
    DetailsDialogComponent,
    EditDialogComponent,
    InviteDialogComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);

  users: User[] = [];
  selectedUser: User | null = null;

  showDetails = false;
  showEdit = false;
  showDelete = false;
  showInvite = false;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.usersService.getAll().subscribe((users) => (this.users = users));
  }

  roleTone(role: UserRole): BadgeTone {
    return ROLE_TONE[role];
  }

  statusTone(status: User['status']): BadgeTone {
    return status === 'Active' ? 'success' : 'default';
  }

  formatJoined(date: string): string {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  openDetails(user: User): void {
    this.selectedUser = user;
    this.showDetails = true;
  }

  openEdit(user: User): void {
    this.selectedUser = user;
    this.showEdit = true;
  }

  openDelete(user: User): void {
    this.selectedUser = user;
    this.showDelete = true;
  }

  openInvite(): void {
    this.showInvite = true;
  }

  closeDetails(): void {
    this.showDetails = false;
    this.selectedUser = null;
  }

  closeEdit(): void {
    this.showEdit = false;
    this.selectedUser = null;
  }

  closeDelete(): void {
    this.showDelete = false;
    this.selectedUser = null;
  }

  closeInvite(): void {
    this.showInvite = false;
  }

  requestDeleteFromEdit(): void {
    this.showEdit = false;
    this.showDelete = true;
  }

  confirmDelete(): void {
    if (!this.selectedUser) return;
    this.usersService.delete(this.selectedUser.id).subscribe(() => {
      this.reload();
      this.closeDelete();
    });
  }

  saveEdit(payload: EditMemberPayload): void {
    if (!this.selectedUser) return;
    const updated: User = { ...this.selectedUser, ...payload };
    this.usersService.update(this.selectedUser.id, updated).subscribe(() => {
      this.reload();
      this.closeEdit();
    });
  }

  sendInvite(payload: InviteMemberPayload): void {
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(payload.name)}`;
    const newUser: Partial<User> = {
      ...payload,
      avatar,
      status: 'Active',
      joinedDate: new Date().toISOString().slice(0, 10),
    };
    this.usersService.create(newUser).subscribe(() => {
      this.reload();
      this.closeInvite();
    });
  }
}
