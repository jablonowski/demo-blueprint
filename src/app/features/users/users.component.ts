import { Component, OnInit, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  ButtonComponent, TableComponent, ColumnDefDirective,
  TagComponent, AvatarComponent, ModalComponent
} from '@jablonowski/dsb-components';
import { UsersService, User } from '../../core/services/users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    NgIf, ReactiveFormsModule,
    ButtonComponent, TableComponent, ColumnDefDirective,
    TagComponent, AvatarComponent, ModalComponent
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private fb = inject(FormBuilder);

  users: Record<string, unknown>[] = [];

  selectedUser: User | null = null;
  deleteModalOpen = false;
  detailsModalOpen = false;
  editModalOpen    = false;
  inviteModalOpen  = false;

  editForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', Validators.required],
    role:      ['', Validators.required]
  });

  inviteForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', Validators.required],
    role:      ['', Validators.required]
  });

  ngOnInit(): void { this.loadUsers(); }

  loadUsers(): void {
    this.usersService.getAll().subscribe(users => {
      this.users = users as unknown as Record<string, unknown>[];
    });
  }

  roleVariant(role: string): 'success' | 'info' | 'default' {
    if (role === 'Admin')  return 'success';
    if (role === 'Editor') return 'info';
    return 'default';
  }

  openDetails(row: Record<string, unknown>): void {
    this.selectedUser = row as unknown as User;
    this.detailsModalOpen = true;
  }

  openEdit(row: Record<string, unknown>): void {
    this.selectedUser = row as unknown as User;
    const [firstName, ...rest] = (this.selectedUser.name ?? '').split(' ');
    this.editForm.setValue({ firstName, lastName: rest.join(' '), email: this.selectedUser.email, role: this.selectedUser.role });
    this.editModalOpen = true;
  }

  openDeleteConfirm(row: Record<string, unknown>): void {
    this.selectedUser = row as unknown as User;
    this.deleteModalOpen = true;
  }

  confirmDelete(): void {
    if (!this.selectedUser?.id) return;
    this.usersService.delete(this.selectedUser.id).subscribe(() => {
      this.deleteModalOpen = false;
      this.selectedUser = null;
      this.loadUsers();
    });
  }

  confirmEdit(): void {
    if (this.editForm.invalid || !this.selectedUser?.id) return;
    const { firstName, lastName, email, role } = this.editForm.value;
    const name = `${firstName} ${lastName}`.trim();
    this.usersService.update(this.selectedUser.id, { ...this.selectedUser, name, email: email!, role: role! }).subscribe(() => {
      this.editModalOpen = false;
      this.selectedUser = null;
      this.loadUsers();
    });
  }

  deleteFromEdit(): void { this.editModalOpen = false; this.deleteModalOpen = true; }

  confirmInvite(): void {
    if (this.inviteForm.invalid) return;
    const { firstName, lastName, email, role } = this.inviteForm.value;
    const name = `${firstName} ${lastName}`.trim();
    const today = new Date().toISOString().split('T')[0];
    this.usersService.create({
      name, email: email!, role: role!, status: 'Active', joinedDate: today,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}`
    }).subscribe(() => {
      this.inviteModalOpen = false;
      this.inviteForm.reset();
      this.loadUsers();
    });
  }

  getInitials(name?: string): string {
    if (!name) return '';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }

  formatJoinedMonth(date?: string): string {
    if (!date) return '';
    const [year, month] = date.split('-');
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  }

  getFirstName(name?: string): string { return name ? name.split(' ')[0] : ''; }
  getLastName(name?: string):  string { return name ? name.split(' ').slice(1).join(' ') : ''; }
}
