import { NgIf } from '@angular/common';
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
} from '@jablonowski/dsb-components';
import { formatMonthYear, formatShortDate, todayIso } from '../../core/date-format.util';
import { User, UserRole } from '../../core/models/user.model';
import { UsersService } from '../../core/users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    TableComponent,
    ColumnDefDirective,
    AvatarComponent,
    TagComponent,
    ButtonComponent,
    ModalComponent,
    InputComponent,
    DropdownComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private fb = inject(FormBuilder);

  users: User[] = [];
  loading = false;

  selectedUser: User | null = null;

  detailsOpen = false;
  editOpen = false;
  deleteOpen = false;
  inviteOpen = false;

  readonly roleOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  readonly editForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
  });

  readonly inviteForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
  });

  readonly formatShortDate = formatShortDate;
  readonly formatMonthYear = formatMonthYear;

  ngOnInit(): void {
    this.load();
  }

  roleVariant(role: UserRole): 'danger' | 'info' | 'default' {
    if (role === 'Admin') return 'danger';
    if (role === 'Editor') return 'info';
    return 'default';
  }

  openDetails(user: User): void {
    this.selectedUser = user;
    this.detailsOpen = true;
  }

  closeDetails(): void {
    this.detailsOpen = false;
  }

  openEdit(user: User): void {
    this.selectedUser = user;
    const [firstName, ...rest] = user.name.split(' ');
    this.editForm.setValue({
      firstName: firstName ?? '',
      lastName: rest.join(' '),
      email: user.email,
      role: user.role,
    });
    this.editOpen = true;
  }

  closeEdit(): void {
    this.editOpen = false;
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
        name: `${firstName} ${lastName}`.trim(),
        email: email ?? '',
        role: (role as UserRole) ?? 'Viewer',
      })
      .subscribe(() => {
        this.editOpen = false;
        this.load();
      });
  }

  deleteFromEdit(): void {
    this.editOpen = false;
    this.deleteOpen = true;
  }

  openDelete(user: User): void {
    this.selectedUser = user;
    this.deleteOpen = true;
  }

  closeDelete(): void {
    this.deleteOpen = false;
  }

  confirmDelete(): void {
    if (!this.selectedUser) {
      return;
    }
    this.usersService.delete(this.selectedUser.id).subscribe(() => {
      this.deleteOpen = false;
      this.selectedUser = null;
      this.load();
    });
  }

  openInvite(): void {
    this.inviteForm.reset({ firstName: '', lastName: '', email: '', role: '' });
    this.inviteOpen = true;
  }

  closeInvite(): void {
    this.inviteOpen = false;
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = `${firstName} ${lastName}`.trim();
    this.usersService
      .create({
        name,
        email: email ?? '',
        role: (role as UserRole) ?? 'Viewer',
        status: 'Active',
        joinedDate: todayIso(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      })
      .subscribe(() => {
        this.inviteOpen = false;
        this.inviteForm.reset({ firstName: '', lastName: '', email: '', role: '' });
        this.load();
      });
  }

  private load(): void {
    this.loading = true;
    this.usersService.getAll().subscribe((users) => {
      this.users = users;
      this.loading = false;
    });
  }
}
