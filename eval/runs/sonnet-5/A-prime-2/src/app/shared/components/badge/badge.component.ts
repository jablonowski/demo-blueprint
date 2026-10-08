import { Component, Input } from '@angular/core';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'default';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `<span class="tag" [class]="'tag-' + tone"><ng-content /></span>`,
})
export class BadgeComponent {
  @Input() tone: BadgeTone = 'default';
}
