import { Component, computed, input, signal } from '@angular/core';
import { initials } from '../core/user.model';

/** Circular avatar: image when it loads, initials otherwise. */
@Component({
  selector: 'app-avatar',
  template: `
    <span class="avatar" [class.avatar-lg]="size() === 'lg'">
      @if (src() && !failed()) {
        <img [src]="src()" [alt]="name()" (error)="failed.set(true)" />
      } @else {
        {{ letters() }}
      }
    </span>
  `,
  styles: `:host { display: inline-flex; }`,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly src = input<string>('');
  readonly size = input<'md' | 'lg'>('md');
  readonly failed = signal(false);
  readonly letters = computed(() => initials(this.name()));
}
