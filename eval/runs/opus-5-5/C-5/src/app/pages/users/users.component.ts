import { AfterViewInit, Component, DestroyRef, ElementRef, computed, inject, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { User, UserRole, UserStatus } from '../../core/user.model';
import { UsersService } from '../../core/users.service';

type MemberForm = FormGroup<{
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  role: FormControl<string>;
}>;

type DialogName = 'details' | 'edit' | 'invite' | 'delete';

const ROLE_TAG: Record<UserRole, TagVariant> = {
  Admin: 'danger',
  Editor: 'info',
  Viewer: 'default',
};

const STATUS_TAG: Record<UserStatus, TagVariant> = {
  Active: 'success',
  Inactive: 'default',
};

function memberForm(): MemberForm {
  return new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
}

function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

function joinName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

@Component({
  selector: 'app-users',
  imports: [
    DatePipe,
    NgTemplateOutlet,
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
export class UsersComponent implements AfterViewInit {
  private readonly usersService = inject(UsersService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly users = signal<User[]>([]);
  readonly rows = computed(() => this.users() as unknown as Record<string, unknown>[]);
  readonly loading = signal(true);
  readonly saving = signal(false);

  /** Avatar URLs that failed to load; those rows fall back to initials. */
  readonly brokenAvatars = signal<ReadonlySet<string>>(new Set());

  readonly selected = signal<User | null>(null);
  readonly dialog = signal<DialogName | null>(null);

  readonly roleOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  readonly editForm = memberForm();
  readonly inviteForm = memberForm();
  readonly detailsForm = new FormGroup({
    firstName: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    lastName: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    email: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    role: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
  });

  editSubmitted = false;
  inviteSubmitted = false;

  constructor() {
    this.load();
  }

  ngAfterViewInit(): void {
    // <img> errors do not bubble, so listen in the capture phase.
    const el = this.host.nativeElement as HTMLElement;
    const onError = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLImageElement && target.classList.contains('avatar-image')) {
        const src = target.getAttribute('src') ?? '';
        this.brokenAvatars.update((set) => new Set(set).add(src));
      }
    };
    el.addEventListener('error', onError, true);
    this.destroyRef.onDestroy(() => el.removeEventListener('error', onError, true));
  }

  // ---- helpers used by the template -------------------------------------

  asUser(row: unknown): User {
    return row as User;
  }

  avatarSrc(user: User): string {
    return this.brokenAvatars().has(user.avatar) ? '' : user.avatar;
  }

  roleTag(role: UserRole): TagVariant {
    return ROLE_TAG[role] ?? 'default';
  }

  statusTag(status: UserStatus): TagVariant {
    return STATUS_TAG[status] ?? 'default';
  }

  showError(form: MemberForm, submitted: boolean, name: keyof MemberForm['controls']): boolean {
    const control = form.controls[name];
    return control.invalid && (control.touched || submitted);
  }

  errorFor(form: MemberForm, submitted: boolean, name: keyof MemberForm['controls'], label: string): string {
    const control = form.controls[name];
    if (!this.showError(form, submitted, name)) {
      return '';
    }
    return control.hasError('email') ? 'Enter a valid email address' : `${label} is required`;
  }

  // ---- data --------------------------------------------------------------

  load(): void {
    this.usersService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ---- dialogs -----------------------------------------------------------

  openDetails(user: User): void {
    this.selected.set(user);
    this.detailsForm.setValue({ ...splitName(user.name), email: user.email, role: user.role });
    this.dialog.set('details');
  }

  openEdit(user: User): void {
    this.selected.set(user);
    this.editSubmitted = false;
    this.editForm.reset({ ...splitName(user.name), email: user.email, role: user.role });
    this.dialog.set('edit');
  }

  openInvite(): void {
    this.selected.set(null);
    this.inviteSubmitted = false;
    this.inviteForm.reset();
    this.dialog.set('invite');
  }

  openDelete(user: User): void {
    this.selected.set(user);
    this.dialog.set('delete');
  }

  /** Edit → Delete keeps the selection and swaps dialogs. */
  editToDelete(): void {
    this.dialog.set('delete');
  }

  /** Close from any path (button, ✕, backdrop, Escape). */
  close(name: DialogName): void {
    if (this.dialog() !== name) {
      return;
    }
    this.dialog.set(null);
    if (name !== 'invite') {
      this.selected.set(null);
    }
  }

  saveEdit(): void {
    this.editSubmitted = true;
    const user = this.selected();
    if (!user || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.editForm.getRawValue();
    const updated: User = { ...user, name: joinName(firstName, lastName), email: email.trim(), role: role as UserRole };
    this.saving.set(true);
    this.usersService.update(user.id, updated).subscribe({
      next: () => {
        this.saving.set(false);
        this.close('edit');
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  sendInvite(): void {
    this.inviteSubmitted = true;
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, role } = this.inviteForm.getRawValue();
    const name = joinName(firstName, lastName);
    const member: Omit<User, 'id'> = {
      name,
      email: email.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName.trim() || name)}`,
      role: role as UserRole,
      status: 'Active',
      joinedDate: today(),
    };
    this.saving.set(true);
    this.usersService.create(member).subscribe({
      next: () => {
        this.saving.set(false);
        this.close('invite');
        this.inviteForm.reset();
        this.inviteSubmitted = false;
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete(): void {
    const user = this.selected();
    if (!user) {
      return;
    }
    this.saving.set(true);
    this.usersService.delete(user.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.load();
        this.close('delete');
      },
      error: () => this.saving.set(false),
    });
  }
}
