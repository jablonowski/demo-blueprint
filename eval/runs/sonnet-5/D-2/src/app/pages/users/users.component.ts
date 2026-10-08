import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  AvatarComponent,
  ButtonComponent,
  ColumnDefDirective,
  TableComponent,
  TagComponent,
  TagVariant,
} from '@jablonowski/dsb-components';
import { UsersService } from '../../core/users.service';
import { User } from '../../core/models/user.model';
import { DeleteConfirmDialogComponent } from './dialogs/delete-confirm-dialog.component';
import { MemberDetailsDialogComponent } from './dialogs/member-details-dialog.component';
import { EditMemberDialogComponent, EditMemberPayload } from './dialogs/edit-member-dialog.component';
import { InviteMemberDialogComponent, InviteMemberPayload } from './dialogs/invite-member-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    DatePipe,
    TableComponent,
    ColumnDefDirective,
    AvatarComponent,
    TagComponent,
    ButtonComponent,
    DeleteConfirmDialogComponent,
    MemberDetailsDialogComponent,
    EditMemberDialogComponent,
    InviteMemberDialogComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);

  protected readonly users = signal<User[]>([]);
  protected readonly selectedUser = signal<User | null>(null);

  protected readonly detailsOpen = signal(false);
  protected readonly editOpen = signal(false);
  protected readonly deleteOpen = signal(false);
  protected readonly inviteOpen = signal(false);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.usersService.getAll().subscribe((users) => this.users.set(users));
  }

  protected asUser(row: Record<string, unknown>): User {
    return row as unknown as User;
  }

  protected get tableRows(): Record<string, unknown>[] {
    return this.users() as unknown as Record<string, unknown>[];
  }

  protected roleVariant(role: User['role']): TagVariant {
    switch (role) {
      case 'Admin':
        return 'danger';
      case 'Editor':
        return 'info';
      default:
        return 'default';
    }
  }

  protected statusVariant(status: User['status']): TagVariant {
    return status === 'Active' ? 'success' : 'default';
  }

  protected openDetails(user: User): void {
    this.selectedUser.set(user);
    this.detailsOpen.set(true);
  }

  protected openEdit(user: User): void {
    this.selectedUser.set(user);
    this.editOpen.set(true);
  }

  protected openDelete(user: User): void {
    this.selectedUser.set(user);
    this.deleteOpen.set(true);
  }

  protected openInvite(): void {
    this.inviteOpen.set(true);
  }

  protected closeDetails(): void {
    this.detailsOpen.set(false);
    this.selectedUser.set(null);
  }

  protected closeEdit(): void {
    this.editOpen.set(false);
    this.selectedUser.set(null);
  }

  protected closeDelete(): void {
    this.deleteOpen.set(false);
    this.selectedUser.set(null);
  }

  protected closeInvite(): void {
    this.inviteOpen.set(false);
  }

  protected onEditDeleteRequested(): void {
    this.editOpen.set(false);
    this.deleteOpen.set(true);
  }

  protected onDeleteConfirmed(): void {
    const user = this.selectedUser();
    if (!user) {
      return;
    }
    this.usersService.delete(user.id).subscribe(() => {
      this.load();
      this.closeDelete();
    });
  }

  protected onEditSaved(payload: EditMemberPayload): void {
    const name = `${payload.firstName} ${payload.lastName}`.trim();
    this.usersService
      .update(payload.id, { name, email: payload.email, role: payload.role })
      .subscribe(() => {
        this.load();
        this.closeEdit();
      });
  }

  protected onInvited(payload: InviteMemberPayload): void {
    const name = `${payload.firstName} ${payload.lastName}`.trim();
    const seed = encodeURIComponent(name) + Date.now();
    this.usersService
      .create({
        name,
        email: payload.email,
        role: payload.role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
        status: 'Active',
        joinedDate: new Date().toISOString().slice(0, 10),
      })
      .subscribe(() => {
        this.load();
        this.closeInvite();
      });
  }
}
