import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AvatarComponent,
  ButtonComponent,
  ColumnDefDirective,
  DropdownComponent,
  DropdownOption,
  InputComponent,
  ModalComponent,
  TableComponent,
  TagComponent
} from '@jablonowski/dsb-components';
import { User, UserRole, UserStatus } from '../../core/data/user.model';
import { UsersService } from '../../core/data/users.service';

@Component({
  selector: 'app-users',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    TableComponent,
    ColumnDefDirective,
    AvatarComponent,
    TagComponent,
    ButtonComponent,
    ModalComponent,
    InputComponent,
    DropdownComponent
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);

  users: User[] = [];
  loading = false;
  selectedUser: User | null = null;

  detailsOpen = false;
  editOpen = false;
  deleteOpen = false;
  inviteOpen = false;

  roleOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' }
  ];

  editForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required]
  });

  inviteForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.usersService.getAll().subscribe((users) => {
      this.users = users;
      this.loading = false;
    });
  }

  roleTagVariant(role: UserRole): 'danger' | 'info' | 'default' {
    if (role === 'Admin') return 'danger';
    if (role === 'Editor') return 'info';
    return 'default';
  }

  statusTagVariant(status: UserStatus): 'success' | 'default' {
    return status === 'Active' ? 'success' : 'default';
  }

  memberSince(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  firstName(fullName: string): string {
    return fullName.split(' ')[0] ?? '';
  }

  lastName(fullName: string): string {
    return fullName.split(' ').slice(1).join(' ');
  }

  openInvite(): void {
    this.inviteForm.reset();
    this.inviteOpen = true;
  }

  openDetails(user: User): void {
    this.selectedUser = user;
    this.detailsOpen = true;
  }

  openEdit(user: User): void {
    this.selectedUser = user;
    const [firstName, ...rest] = user.name.split(' ');
    this.editForm.setValue({
      firstName,
      lastName: rest.join(' '),
      email: user.email,
      role: user.role
    });
    this.editOpen = true;
  }

  openDelete(user: User): void {
    this.selectedUser = user;
    this.deleteOpen = true;
  }

  openDeleteFromEdit(): void {
    this.editOpen = false;
    this.deleteOpen = true;
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
    this.inviteForm.reset();
  }

  saveEdit(): void {
    if (this.editForm.invalid || !this.selectedUser) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const id = this.selectedUser.id;
    this.usersService
      .update(id, {
        ...this.selectedUser,
        name: `${firstName} ${lastName}`,
        email: email ?? '',
        role: (role ?? 'Viewer') as UserRole
      })
      .subscribe(() => {
        this.load();
        this.closeEdit();
      });
  }

  confirmDelete(): void {
    if (!this.selectedUser) return;
    const id = this.selectedUser.id;
    this.usersService.delete(id).subscribe(() => {
      this.load();
      this.closeDelete();
    });
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    this.usersService
      .create({
        name: `${firstName} ${lastName}`,
        email: email ?? '',
        role: (role ?? 'Viewer') as UserRole,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName ?? '')}`,
        status: 'Active',
        joinedDate: new Date().toISOString().slice(0, 10)
      })
      .subscribe(() => {
        this.load();
        this.closeInvite();
      });
  }
}
