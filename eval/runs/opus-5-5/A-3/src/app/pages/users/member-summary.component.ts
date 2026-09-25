import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { User } from '../../core/user.model';
import { AvatarComponent } from '../../shared/avatar.component';
import { monthYear } from '../../shared/user-display';

/** Avatar (initials) + name + "Member since …", as in the edit and details modals. */
@Component({
  selector: 'app-member-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarComponent],
  template: `
    <app-avatar [name]="user().name" size="md" />
    <div class="info">
      <span class="name">{{ user().name }}</span>
      <span class="since">Member since {{ since() }}</span>
    </div>
  `,
  styles: `
    :host { display: flex; align-items: center; gap: var(--space-3-5); }
    .info { display: flex; flex-direction: column; gap: var(--space-0-5); min-width: 0; }
    .name { font-size: var(--text-lg); font-weight: var(--weight-semibold); color: var(--text-primary); }
    .since { font-size: var(--text-sm); color: var(--text-muted); }
  `,
})
export class MemberSummaryComponent {
  readonly user = input.required<User>();
  protected readonly since = computed(() => monthYear(this.user().joinedDate));
}
