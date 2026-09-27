import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
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
  TagComponent,
  TagVariant,
} from '@jablonowski/dsb-components';
import { User, UserRole, UserStatus } from '../../core/models/user.model';
import { UsersService } from '../../core/users.service';

const ROLE_OPTIONS: DropdownOption[] = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Editor', label: 'Editor' },
  { value: 'Viewer', label: 'Viewer' },
];

const ROLE_TAG_VARIANT: Record<UserRole, TagVariant> = {
  Admin: 'danger',
  Editor: 'info',
  Viewer: 'default',
};

const STATUS_TAG_VARIANT: Record<UserStatus, TagVariant> = {
  Active: 'success',
  Inactive: 'default',
};

interface NameParts {
  firstName: string;
  lastName: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AvatarComponent,
    ButtonComponent,
    ColumnDefDirective,
    DropdownComponent,
    InputComponent,
    ModalComponent,
    TableComponent,
    TagComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private fb = inject(FormBuilder);

  users: User[] = [];
  loading = false;

  roleOptions = ROLE_OPTIONS;
  selectedUser: User | null = null;

  showDetailsDialog = false;
  showEditDialog = false;
  showDeleteDialog = false;
  showInviteDialog = false;

  editForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
  });

  inviteForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
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

  roleTagVariant(role: UserRole): TagVariant {
    return ROLE_TAG_VARIANT[role];
  }

  statusTagVariant(status: UserStatus): TagVariant {
    return STATUS_TAG_VARIANT[status];
  }

  memberSince(joinedDate: string): string {
    const date = new Date(joinedDate);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  splitName(fullName: string): NameParts {
    const trimmed = fullName.trim();
    const spaceIndex = trimmed.indexOf(' ');
    if (spaceIndex === -1) {
      return { firstName: trimmed, lastName: '' };
    }
    return {
      firstName: trimmed.slice(0, spaceIndex),
      lastName: trimmed.slice(spaceIndex + 1),
    };
  }

  // --- Details dialog ---

  openDetails(user: User): void {
    this.selectedUser = user;
    this.showDetailsDialog = true;
  }

  closeDetails(): void {
    this.showDetailsDialog = false;
  }

  // --- Edit dialog ---

  openEdit(user: User): void {
    this.selectedUser = user;
    const { firstName, lastName } = this.splitName(user.name);
    this.editForm.setValue({
      firstName,
      lastName,
      email: user.email,
      role: user.role,
    });
    this.showEditDialog = true;
  }

  closeEdit(): void {
    this.showEditDialog = false;
  }

  saveEdit(): void {
    if (this.editForm.invalid || !this.selectedUser) {
      this.editForm.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = {
      ...this.selectedUser,
      name: `${firstName} ${lastName}`.trim(),
      email: email ?? '',
      role: (role ?? 'Viewer') as UserRole,
    };

    this.usersService
      .update(updated.id, updated)
      .subscribe(() => {
        this.load();
        this.closeEdit();
        this.selectedUser = null;
      });
  }

  deleteFromEdit(): void {
    this.showEditDialog = false;
    this.showDeleteDialog = true;
  }

  // --- Delete dialog ---

  openDelete(user: User): void {
    this.selectedUser = user;
    this.showDeleteDialog = true;
  }

  closeDelete(): void {
    this.showDeleteDialog = false;
    this.selectedUser = null;
  }

  confirmDelete(): void {
    if (!this.selectedUser) {
      return;
    }

    this.usersService.delete(this.selectedUser.id).subscribe(() => {
      this.load();
      this.showDeleteDialog = false;
      this.selectedUser = null;
    });
  }

  // --- Invite dialog ---

  openInvite(): void {
    this.inviteForm.reset({ firstName: '', lastName: '', email: '', role: '' });
    this.showInviteDialog = true;
  }

  closeInvite(): void {
    this.showInviteDialog = false;
  }

  submitInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = `${firstName} ${lastName}`.trim();
    const today = new Date().toISOString().slice(0, 10);

    this.usersService
      .create({
        name,
        email: email ?? '',
        role: (role ?? 'Viewer') as UserRole,
        status: 'Active',
        joinedDate: today,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      })
      .subscribe(() => {
        this.load();
        this.closeInvite();
        this.inviteForm.reset({ firstName: '', lastName: '', email: '', role: '' });
      });
  }
}
