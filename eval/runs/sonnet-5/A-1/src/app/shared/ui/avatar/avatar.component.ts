import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-avatar',
  standalone: true,
  template: `
    <span class="ui-avatar" [class.ui-avatar--md]="size === 'md'">
      @if (src && !imgFailed) {
        <img [src]="src" [alt]="name" (error)="imgFailed = true" />
      } @else {
        <span class="ui-avatar__initials">{{ initials }}</span>
      }
    </span>
  `,
  styleUrl: './avatar.component.css'
})
export class AvatarComponent {
  @Input() src: string | null | undefined;
  @Input() name = '';
  @Input() size: 'sm' | 'md' = 'sm';

  imgFailed = false;

  get initials(): string {
    return this.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
}
