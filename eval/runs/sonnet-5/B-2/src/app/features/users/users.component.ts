import { Component, OnInit } from '@angular/core';
import {
  AvatarComponent,
  ButtonComponent,
  ColumnDefDirective,
  TableComponent,
  TagComponent,
} from '@jablonowski/dsb-components';
import { User } from '../../core/models/user.model';
import { UsersService } from '../../core/services/users.service';
import { roleVariant, statusVariant } from '../../core/utils/badge.util';
import { DeleteConfirmDialogComponent } from './dialogs/delete-confirm-dialog.component';
import { MemberDetailsDialogComponent } from './dialogs/member-details-dialog.component';
import { EditMemberDialogComponent } from './dialogs/edit-member-dialog.component';
import { InviteMemberDialogComponent } from './dialogs/invite-member-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    AvatarComponent,
    ButtonComponent,
    ColumnDefDirective,
    TableComponent,
    TagComponent,
    DeleteConfirmDialogComponent,
    MemberDetailsDialogComponent,
    EditMemberDialogComponent,
    InviteMemberDialogComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = false;

  selectedUser: User | null = null;

  private failedAvatars = new Set<string>();

  detailsOpen = false;
  editOpen = false;
  inviteOpen = false;
  deleteOpen = false;

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.usersService.getAll().subscribe((users) => {
      this.users = users;
      this.loading = false;
    });
  }

  readonly roleVariant = roleVariant;
  readonly statusVariant = statusVariant;

  avatarSrc(avatar: string): string {
    return this.failedAvatars.has(avatar) ? '' : avatar;
  }

  onAvatarError(avatar: string): void {
    if (!this.failedAvatars.has(avatar)) {
      this.failedAvatars.add(avatar);
      this.users = [...this.users];
    }
  }

  openDetails(user: User): void {
    this.selectedUser = user;
    this.detailsOpen = true;
  }

  openEdit(user: User): void {
    this.selectedUser = user;
    this.editOpen = true;
  }

  openInvite(): void {
    this.inviteOpen = true;
  }

  openDelete(user: User): void {
    this.selectedUser = user;
    this.deleteOpen = true;
  }

  onEditDeleteRequested(): void {
    this.editOpen = false;
    this.deleteOpen = true;
  }

  onDeleted(): void {
    this.deleteOpen = false;
    this.selectedUser = null;
    this.loadUsers();
  }

  onSaved(): void {
    this.editOpen = false;
    this.selectedUser = null;
    this.loadUsers();
  }

  onInvited(): void {
    this.inviteOpen = false;
    this.loadUsers();
  }

  closeDetails(): void {
    this.detailsOpen = false;
    this.selectedUser = null;
  }

  closeEdit(): void {
    this.editOpen = false;
    this.selectedUser = null;
  }

  closeDelete(): void {
    this.deleteOpen = false;
    this.selectedUser = null;
  }

  closeInvite(): void {
    this.inviteOpen = false;
  }
}
