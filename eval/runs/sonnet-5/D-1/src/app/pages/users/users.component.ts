import { Component, OnInit, inject } from '@angular/core';
import { AvatarComponent, ButtonComponent, ColumnDefDirective, TableComponent, TagComponent } from '@jablonowski/dsb-components';
import { UsersService } from '../../core/users.service';
import { Member } from '../../core/models/user.model';
import { DeleteConfirmDialogComponent } from './dialogs/delete-confirm-dialog.component';
import { MemberDetailsDialogComponent } from './dialogs/member-details-dialog.component';
import { MemberEditDialogComponent, MemberEditPayload } from './dialogs/member-edit-dialog.component';
import { MemberInviteDialogComponent, MemberInvitePayload } from './dialogs/member-invite-dialog.component';
import { roleTagVariant, statusTagVariant } from './dialogs/member-form.util';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    TableComponent,
    ColumnDefDirective,
    AvatarComponent,
    TagComponent,
    ButtonComponent,
    DeleteConfirmDialogComponent,
    MemberDetailsDialogComponent,
    MemberEditDialogComponent,
    MemberInviteDialogComponent
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);

  readonly roleTagVariant = roleTagVariant;
  readonly statusTagVariant = statusTagVariant;

  members: Member[] = [];
  loading = false;

  selectedMember: Member | null = null;
  detailsOpen = false;
  editOpen = false;
  inviteOpen = false;
  deleteOpen = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.usersService.getAll().subscribe((members) => {
      this.members = members;
      this.loading = false;
    });
  }

  openDetails(member: Member): void {
    this.selectedMember = member;
    this.detailsOpen = true;
  }

  openEdit(member: Member): void {
    this.selectedMember = member;
    this.editOpen = true;
  }

  openInvite(): void {
    this.inviteOpen = true;
  }

  openDelete(member: Member): void {
    this.selectedMember = member;
    this.deleteOpen = true;
  }

  onEditDeleteRequested(member: Member): void {
    this.editOpen = false;
    this.selectedMember = member;
    this.deleteOpen = true;
  }

  onDeleteConfirmed(): void {
    if (!this.selectedMember) {
      return;
    }
    this.usersService.delete(this.selectedMember.id).subscribe(() => {
      this.deleteOpen = false;
      this.selectedMember = null;
      this.load();
    });
  }

  onSaveEdit(payload: MemberEditPayload): void {
    const { id, ...changes } = payload;
    this.usersService.update(id, changes).subscribe(() => {
      this.editOpen = false;
      this.selectedMember = null;
      this.load();
    });
  }

  onInviteSubmit(payload: MemberInvitePayload): void {
    const avatarSeed = encodeURIComponent(payload.name.replace(/\s+/g, ''));
    this.usersService
      .create({
        name: payload.name,
        email: payload.email,
        role: payload.role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
        status: 'Active',
        joinedDate: new Date().toISOString().slice(0, 10)
      })
      .subscribe(() => {
        this.inviteOpen = false;
        this.load();
      });
  }
}
