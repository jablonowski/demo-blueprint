import { Component, OnInit, inject } from '@angular/core';
import { UsersService } from '../../core/services/users.service';
import { User, UserRole, UserStatus } from '../../core/models/user.model';
import { ButtonDirective } from '../../shared/ui/button/button.directive';
import { BadgeComponent, BadgeTone } from '../../shared/ui/badge/badge.component';
import { AvatarComponent } from '../../shared/ui/avatar/avatar.component';
import { DatePipe } from '@angular/common';
import { DeleteConfirmDialogComponent } from './components/delete-confirm-dialog.component';
import { MemberDetailsDialogComponent } from './components/member-details-dialog.component';
import { EditMemberDialogComponent, EditMemberResult } from './components/edit-member-dialog.component';
import { InviteMemberDialogComponent, InviteMemberResult } from './components/invite-member-dialog.component';

type DialogType = 'details' | 'edit' | 'delete' | 'invite' | null;

const ROLE_TONE: Record<UserRole, BadgeTone> = {
  Admin: 'danger',
  Editor: 'info',
  Viewer: 'neutral'
};

const STATUS_TONE: Record<UserStatus, BadgeTone> = {
  Active: 'positive',
  Inactive: 'neutral'
};

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    ButtonDirective,
    BadgeComponent,
    AvatarComponent,
    DatePipe,
    DeleteConfirmDialogComponent,
    MemberDetailsDialogComponent,
    EditMemberDialogComponent,
    InviteMemberDialogComponent
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);

  users: User[] = [];
  activeDialog: DialogType = null;
  selectedUser: User | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.usersService.getAll().subscribe((users) => (this.users = users));
  }

  roleTone(role: UserRole): BadgeTone {
    return ROLE_TONE[role];
  }

  statusTone(status: UserStatus): BadgeTone {
    return STATUS_TONE[status];
  }

  openDetails(user: User): void {
    this.selectedUser = user;
    this.activeDialog = 'details';
  }

  openEdit(user: User): void {
    this.selectedUser = user;
    this.activeDialog = 'edit';
  }

  openDelete(user: User): void {
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

  onEditDeleteRequested(): void {
    this.activeDialog = 'delete';
  }

  onEditSaved(result: EditMemberResult): void {
    if (!this.selectedUser) {
      return;
    }
    const updated: User = { ...this.selectedUser, ...result };
    this.usersService.update(this.selectedUser.id, updated).subscribe(() => {
      this.load();
      this.closeDialog();
    });
  }

  onDeleteConfirmed(): void {
    if (!this.selectedUser) {
      return;
    }
    this.usersService.delete(this.selectedUser.id).subscribe(() => {
      this.load();
      this.closeDialog();
    });
  }

  onInviteSaved(result: InviteMemberResult): void {
    const avatarSeed = encodeURIComponent(result.name);
    this.usersService
      .create({
        ...result,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
        status: 'Active',
        joinedDate: new Date().toISOString().slice(0, 10)
      })
      .subscribe(() => {
        this.load();
        this.closeDialog();
      });
  }
}
