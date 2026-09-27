import { Component, Input } from '@angular/core';

export type BadgeTone = 'positive' | 'negative' | 'warning' | 'neutral' | 'info' | 'danger';

@Component({
  selector: 'ui-badge',
  standalone: true,
  template: `<span class="ui-badge" [class]="'ui-badge--' + tone"><ng-content /></span>`,
  styleUrl: './badge.component.css'
})
export class BadgeComponent {
  @Input() tone: BadgeTone = 'neutral';
}
